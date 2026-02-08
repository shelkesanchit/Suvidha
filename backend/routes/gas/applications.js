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
      'SELECT COUNT(*) as count FROM gas_applications WHERE YEAR(submitted_at) = ?',
      [year]
    );
    const applicationNumber = `${typePrefix}${year}${String(countResult[0].count + 1).padStart(6, '0')}`;
    
    // Calculate fees based on connection type
    const connectionFees = {
      'png_domestic': { connection_fee: 5000, security_deposit: 3000 },
      'png_commercial': { connection_fee: 10000, security_deposit: 5000 },
      'png_industrial': { connection_fee: 25000, security_deposit: 10000 },
      'lpg_domestic': { connection_fee: 1500, security_deposit: 2000 },
      'lpg_commercial': { connection_fee: 3500, security_deposit: 3500 }
    };
    const connectionType = `${application_data.gas_type || 'png'}_${application_data.property_type || 'domestic'}`;
    const fees = connectionFees[connectionType] || connectionFees['png_domestic'];
    const application_fee = 500;
    const total_fee = application_fee + fees.connection_fee + fees.security_deposit;
    
    // Initialize stage history
    const stageHistory = [{
      stage: 'Application Submitted',
      status: 'submitted',
      timestamp: new Date().toISOString(),
      remarks: 'Application submitted successfully'
    }];
    
    // Insert application
    const [result] = await connection.query(
      `INSERT INTO gas_applications 
      (application_number, application_type, applicant_category, gas_type, full_name, father_spouse_name, 
       aadhaar_number, mobile, email, property_id, house_flat_no, building_name, ward, 
       address, landmark, property_type, ownership_status, connection_purpose, 
       pipeline_distance, cylinder_type, status, current_stage, stage_history,
       documents, application_fee, connection_fee, security_deposit, total_fee) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        applicationNumber,
        application_type || 'new_connection',
        application_data.applicant_category || 'individual',
        application_data.gas_type || 'png',
        application_data.full_name,
        application_data.father_spouse_name || null,
        application_data.aadhaar_number || null,
        application_data.mobile,
        application_data.email || null,
        application_data.property_id || null,
        application_data.house_flat_no || null,
        application_data.building_name || null,
        application_data.ward || null,
        application_data.address || `${application_data.house_flat_no}, ${application_data.building_name}, Ward ${application_data.ward}`,
        application_data.landmark || null,
        application_data.property_type || 'domestic',
        application_data.ownership_status || 'owner',
        application_data.connection_purpose || 'cooking',
        application_data.pipeline_distance || null,
        application_data.cylinder_type || null,
        'submitted',
        'Application Submitted',
        JSON.stringify(stageHistory),
        JSON.stringify(application_data.documents || []),
        application_fee,
        fees.connection_fee,
        fees.security_deposit,
        total_fee
      ]
    );
    
    await connection.commit();
    
    res.status(201).json({
      success: true,
      message: 'Gas connection application submitted successfully',
      data: {
        application_number: applicationNumber,
        application_id: result.insertId,
        fees: {
          application_fee,
          connection_fee: fees.connection_fee,
          security_deposit: fees.security_deposit,
          total_fee
        }
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
      `SELECT application_number, application_type, gas_type, full_name, mobile, email, ward,
              property_type, house_flat_no, address, landmark, status, 
              current_stage, stage_history, submitted_at, processed_at, completed_at,
              cylinder_type, pipeline_distance, total_fee, fee_paid,
              assigned_engineer, remarks, rejection_reason
       FROM gas_applications 
       WHERE application_number = ?`,
      [applicationNumber]
    );
    
    if (applications.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    
    const app = applications[0];
    // Handle JSON field
    if (app.stage_history) {
      if (typeof app.stage_history === 'string') {
        try { app.stage_history = JSON.parse(app.stage_history); } catch (e) { app.stage_history = []; }
      }
    } else {
      app.stage_history = [];
    }
    
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
      `SELECT id, application_number, application_type, gas_type, status, current_stage, 
              submitted_at, total_fee, fee_paid
       FROM gas_applications 
       WHERE mobile = ?
       ORDER BY submitted_at DESC`,
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
      `SELECT id, consumer_number, full_name, mobile, address, gas_type, 
              connection_status, property_type 
       FROM gas_consumers 
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
        'SELECT * FROM gas_consumers WHERE consumer_number = ?',
        [consumer_number]
      );
    }
    
    // If not found by consumer_number, try by mobile
    if (consumers.length === 0 && mobile) {
      [consumers] = await connection.query(
        'SELECT * FROM gas_consumers WHERE mobile = ? AND connection_status = "active"',
        [mobile]
      );
    }
    
    if (consumers.length === 0) {
      return res.status(404).json({ success: false, message: 'Consumer not found. Please ensure you have an active gas connection.' });
    }
    
    const consumer = consumers[0];
    
    // Determine cylinder type based on consumer's property type or use default
    const actualCylinderType = cylinder_type || 
      (consumer.property_type === 'commercial' ? 'commercial_19kg' : 'domestic_14.2kg');
    
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
    
    // Insert booking
    const [result] = await connection.query(
      `INSERT INTO gas_cylinder_bookings 
      (booking_number, consumer_id, consumer_number, cylinder_type, quantity, 
       unit_price, total_amount, delivery_preference, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        bookingNumber,
        consumer.id,
        consumer.consumer_number,
        actualCylinderType,
        quantity,
        pricePerUnit,
        totalAmount,
        delivery_preference || 'home_delivery',
        'booked'
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
