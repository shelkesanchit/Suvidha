const express = require('express');
const router = express.Router();
const { promisePool } = require('../../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for gas document uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/gas-documents');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `gas-doc-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images (JPEG, PNG) and PDF files are allowed'));
    }
  }
});

// =====================================================
// GAS APPLICATIONS ROUTES
// =====================================================

// Submit new gas application
router.post('/submit', async (req, res) => {
  const connection = await promisePool.getConnection();
  try {
    await connection.beginTransaction();
    
    const { application_type, application_data } = req.body;
    
    // Generate application number
    const year = new Date().getFullYear();
    const typePrefix = {
      'new_connection': 'GNC',
      'reconnection': 'GRC',
      'disconnection': 'GDC',
      'transfer': 'GTR',
      'cylinder_booking': 'GCB',
      'conversion': 'GCV'
    }[application_type] || 'GAPP';
    
    const [countResult] = await connection.query(
      'SELECT COUNT(*) as count FROM gas_applications WHERE YEAR(created_at) = ?',
      [year]
    );
    const applicationNumber = `${typePrefix}${year}${String(countResult[0].count + 1).padStart(6, '0')}`;
    
    // Map connection_type to valid ENUM value
    const connectionTypeMap = {
      'domestic': 'domestic',
      'pmuy': 'pmuy',
      'commercial': 'commercial',
      'png_domestic': 'domestic',
      'png_commercial': 'commercial',
      'lpg_domestic': 'domestic',
      'lpg_commercial': 'commercial'
    };
    const connType = connectionTypeMap[application_data.connection_type] || 'domestic';
    
    // Map cylinder_type to valid ENUM value  
    const cylinderTypeMap = {
      'domestic_14.2kg': '14kg',
      '14kg': '14kg',
      '19kg': '19kg',
      'commercial_19kg': 'commercial',
      'commercial_47.5kg': 'commercial',
      'commercial': 'commercial'
    };
    const cylType = cylinderTypeMap[application_data.cylinder_type] || '14kg';
    
    // Insert application - using ACTUAL gas_applications table columns
    const [result] = await connection.query(
      `INSERT INTO gas_applications 
      (application_number, full_name, mobile, email, aadhar_number, 
       state, city, pincode, address, plot_number, 
       cylinder_type, connection_type, gst_number, trade_license, business_name,
       documents, distributor_name, distributor_code, application_status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted')`,
      [
        applicationNumber,
        application_data.full_name || application_data.applicant_name || 'Unknown',
        application_data.mobile,
        application_data.email || null,
        application_data.aadhaar_number || null,
        application_data.state || 'Maharashtra',
        application_data.city || application_data.property_type || 'NA',
        application_data.pin_code || application_data.pincode || '000000',
        application_data.address || 'NA',
        application_data.plot_number || application_data.property_id || null,
        cylType,
        connType,
        application_data.gst_number || null,
        application_data.trade_license || null,
        application_data.business_name || null,
        JSON.stringify(application_data.documents || []),
        application_data.distributor_name || application_data.lpg_provider_name || application_data.png_provider_name || null,
        application_data.distributor_id || application_data.distributor_code || null,
      ]
    );
    
    await connection.commit();
    
    res.status(201).json({
      success: true,
      message: 'Gas connection application submitted successfully',
      data: {
        application_number: applicationNumber,
        application_id: result.insertId
      }
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Submit gas application error:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
});

// Track application status
router.get('/track/:applicationNumber', async (req, res) => {
  try {
    const { applicationNumber } = req.params;
    
    const [applications] = await promisePool.query(
      `SELECT a.application_number, a.full_name, a.mobile, a.email,
              a.address, a.cylinder_type, a.connection_type, a.application_status,
              a.distributor_name, a.created_at, a.processed_at,
              c.id as consumer_id, c.connection_status
       FROM gas_applications a
       LEFT JOIN gas_customers c ON c.full_name COLLATE utf8mb4_unicode_ci = a.full_name COLLATE utf8mb4_unicode_ci AND c.mobile COLLATE utf8mb4_unicode_ci = a.mobile COLLATE utf8mb4_unicode_ci
       WHERE a.application_number = ?`,
      [applicationNumber]
    );
    
    if (applications.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    
    const app = applications[0];
    
    res.json({ success: true, data: app });
    
  } catch (error) {
    console.error('Track application error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get user's applications by mobile
router.get('/my-applications/:mobile', async (req, res) => {
  try {
    const { mobile } = req.params;
    
    const [applications] = await promisePool.query(
      `SELECT id, application_number, connection_type, application_status, 
              created_at
       FROM gas_applications 
       WHERE mobile = ?
       ORDER BY created_at DESC`,
      [mobile]
    );
    
    res.json({ success: true, data: applications });
    
  } catch (error) {
    console.error('Get my applications error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Lookup consumer by mobile number for cylinder booking
router.get('/consumer-by-mobile/:mobile', async (req, res) => {
  try {
    const { mobile } = req.params;
    
    const [consumers] = await promisePool.query(
      `SELECT id, consumer_id, full_name, mobile, address, 
              connection_status, connection_type 
       FROM gas_customers 
       WHERE mobile = ? AND connection_status = 'active'`,
      [mobile]
    );
    
    if (consumers.length === 0) {
      return res.status(404).json({ success: false, message: 'No active consumer found with this mobile number' });
    }
    
    res.json({ success: true, data: consumers[0] });
    
  } catch (error) {
    console.error('Consumer lookup error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Book LPG cylinder
router.post('/cylinder-booking', async (req, res) => {
  const connection = await promisePool.getConnection();
  try {
    await connection.beginTransaction();
    
    const { consumer_number, mobile, cylinder_type, quantity = 1, delivery_preference } = req.body;
    
    // Find consumer - first try by consumer_number, then by mobile
    let consumers = [];
    if (consumer_number) {
      [consumers] = await connection.query(
        'SELECT * FROM gas_customers WHERE consumer_id = ?',
        [consumer_number]
      );
    }
    
    // If not found by consumer_number, try by mobile
    if (consumers.length === 0 && mobile) {
      [consumers] = await connection.query(
        'SELECT * FROM gas_customers WHERE mobile = ? AND connection_status = "active"',
        [mobile]
      );
    }
    
    if (consumers.length === 0) {
      return res.status(404).json({ success: false, message: 'Consumer not found. Please ensure you have an active gas connection.' });
    }
    
    const consumer = consumers[0];
    
    // Determine cylinder type based on consumer's connection_type or use default
    const actualCylinderType = cylinder_type || 
      (consumer.connection_type === 'commercial' ? 'commercial_19kg' : 'domestic_14.2kg');
    
    // Generate booking number
    const year = new Date().getFullYear();
    const [countResult] = await connection.query(
      'SELECT COUNT(*) as count FROM gas_cylinder_bookings WHERE YEAR(booked_at) = ?',
      [year]
    );
    const bookingNumber = `GCB${year}${String(countResult[0].count + 1).padStart(6, '0')}`;
    
    // Calculate price
    const cylinderPrices = {
      'domestic_14.2kg': 850,
      'domestic_5kg': 450,
      'commercial_19kg': 2100,
      'commercial_47.5kg': 5200
    };
    const pricePerUnit = cylinderPrices[actualCylinderType] || 850;
    const totalAmount = pricePerUnit * quantity;
    
    // Map to valid ENUM values
    const cylBookingMap = {
      'domestic_14.2kg': '14kg',
      'domestic_5kg': '14kg',
      'commercial_19kg': '19kg',
      'commercial_47.5kg': 'commercial',
      '14kg': '14kg',
      '19kg': '19kg',
      'commercial': 'commercial'
    };
    
    // Insert booking
    const [result] = await connection.query(
      `INSERT INTO gas_cylinder_bookings 
      (booking_number, customer_id, cylinder_type, quantity, 
       total_amount, delivery_type, booking_status) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        bookingNumber,
        consumer.id,
        cylBookingMap[actualCylinderType] || '14kg',
        quantity,
        totalAmount,
        delivery_preference || 'home_delivery',
        'placed'
      ]
    );
    
    await connection.commit();
    
    res.status(201).json({
      success: true,
      message: 'Cylinder booked successfully',
      data: {
        booking_number: bookingNumber,
        booking_id: result.insertId,
        estimated_delivery: '2-3 business days',
        amount: totalAmount
      }
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Cylinder booking error:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
});

// =====================================================
// DOCUMENT UPLOAD ROUTES
// =====================================================

// Upload documents for gas application
router.post('/upload-documents', upload.array('documents', 5), async (req, res) => {
  try {
    const { application_number } = req.body;
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    // Check if application exists
    const [apps] = await promisePool.query(
      'SELECT id, documents FROM gas_applications WHERE application_number = ?',
      [application_number]
    );

    if (apps.length === 0) {
      // Delete uploaded files if application not found
      req.files.forEach(file => fs.unlinkSync(file.path));
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    // Parse existing documents
    let existingDocs = [];
    try {
      existingDocs = JSON.parse(apps[0].documents || '[]');
    } catch { existingDocs = []; }

    // Add new documents
    const newDocs = req.files.map((file, index) => ({
      id: Date.now() + index,
      filename: file.filename,
      originalName: file.originalname,
      documentType: req.body[`documentType_${index}`] || req.body.documentType || 'other',
      mimeType: file.mimetype,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      path: `/uploads/gas-documents/${file.filename}`
    }));

    const allDocs = [...existingDocs, ...newDocs];

    // Update application with document references
    await promisePool.query(
      'UPDATE gas_applications SET documents = ? WHERE application_number = ?',
      [JSON.stringify(allDocs), application_number]
    );

    res.json({
      success: true,
      message: 'Documents uploaded successfully',
      data: { documents: newDocs }
    });

  } catch (error) {
    console.error('Document upload error:', error);
    // Clean up uploaded files on error
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// Upload single document with type
router.post('/upload-document', upload.single('document'), async (req, res) => {
  try {
    const { application_number, documentType } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Check if application exists
    const [apps] = await promisePool.query(
      'SELECT id, documents FROM gas_applications WHERE application_number = ?',
      [application_number]
    );

    if (apps.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    // Parse existing documents
    let existingDocs = [];
    try {
      existingDocs = JSON.parse(apps[0].documents || '[]');
    } catch { existingDocs = []; }

    // Create new document entry
    const newDoc = {
      id: Date.now(),
      filename: req.file.filename,
      originalName: req.file.originalname,
      documentType: documentType || 'other',
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploadedAt: new Date().toISOString(),
      path: `/uploads/gas-documents/${req.file.filename}`
    };

    // Replace existing document of same type or add new
    const existingIndex = existingDocs.findIndex(d => d.documentType === documentType);
    if (existingIndex >= 0) {
      // Delete old file
      const oldPath = path.join(__dirname, '../../uploads/gas-documents', existingDocs[existingIndex].filename);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      existingDocs[existingIndex] = newDoc;
    } else {
      existingDocs.push(newDoc);
    }

    // Update application with document references
    await promisePool.query(
      'UPDATE gas_applications SET documents = ? WHERE application_number = ?',
      [JSON.stringify(existingDocs), application_number]
    );

    res.json({
      success: true,
      message: 'Document uploaded successfully',
      data: { document: newDoc }
    });

  } catch (error) {
    console.error('Document upload error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get documents for an application
router.get('/documents/:application_number', async (req, res) => {
  try {
    const { application_number } = req.params;
    
    const [apps] = await promisePool.query(
      'SELECT documents FROM gas_applications WHERE application_number = ?',
      [application_number]
    );

    if (apps.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    let documents = [];
    try {
      documents = JSON.parse(apps[0].documents || '[]');
    } catch { documents = []; }

    res.json({ success: true, data: documents });
    
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
