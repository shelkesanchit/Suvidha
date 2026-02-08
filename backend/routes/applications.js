const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { promisePool } = require('../config/database');
const { verifyToken } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/documents');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'doc-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images, PDF, and document files are allowed'));
    }
  }
});

// Submit new application
router.post('/submit', [
  body('application_type').isIn([
    'new_connection', 'change_of_load', 'change_of_name', 
    'address_correction', 'reconnection', 'category_change',
    'solar_rooftop', 'ev_charging', 'prepaid_recharge', 'meter_reading'
  ]),
  body('application_data').isObject()
], async (req, res) => {
  const connection = await promisePool.getConnection();
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Validation errors:', errors.array());
      return res.status(400).json({ 
        success: false,
        error: 'Validation failed',
        errors: errors.array(),
        received: {
          application_type: typeof req.body.application_type,
          application_data: typeof req.body.application_data
        }
      });
    }

    await connection.beginTransaction();

    const { application_type, application_data, documents } = req.body;

    // Generate application number with type prefix
    const year = new Date().getFullYear();
    const typePrefix = {
      'new_connection': 'NC',
      'change_of_load': 'CL',
      'change_of_name': 'CN',
      'address_correction': 'AC',
      'reconnection': 'RC',
      'category_change': 'CC',
      'solar_rooftop': 'SR',
      'ev_charging': 'EV',
      'prepaid_recharge': 'PR',
      'meter_reading': 'MR'
    }[application_type] || 'APP';
    
    const [countResult] = await connection.query(
      'SELECT COUNT(*) as count FROM applications WHERE YEAR(submitted_at) = ? AND application_type = ?',
      [year, application_type]
    );
    const applicationNumber = `${typePrefix}${year}${String(countResult[0].count + 1).padStart(6, '0')}`;

    // Insert application
    const [result] = await connection.query(
      `INSERT INTO applications 
      (application_number, applicant_name, mobile, email, aadhar_number, state, city, pincode, address, 
       service_type, application_type, application_status, documents, application_data, remarks, submitted_by) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [applicationNumber, application_data.full_name, application_data.mobile, application_data.email, 
       application_data.aadhar_number || null, application_data.state, application_data.city, 
       application_data.pincode, application_data.premises_address, 'electricity', application_type, 
       'submitted', JSON.stringify(documents || []), JSON.stringify(application_data), 'Application submitted successfully', 
       req.user?.name || 'User']
    );

    const applicationId = result.insertId;

    // For new connection applications, validate required fields
    if (application_type === 'new_connection') {
      // Validate required fields
      const requiredFields = ['full_name', 'email', 'mobile', 'premises_address', 'district', 'city', 'state', 'pincode', 'category'];
      const missingFields = requiredFields.filter(field => !application_data[field] || application_data[field] === '');
      
      if (missingFields.length > 0) {
        await connection.rollback();
        return res.status(400).json({ 
          success: false,
          message: `Missing required fields: ${missingFields.join(', ')}` 
        });
      }
      // Note: Detailed application data is stored in JSON format in the applications table
      // No need for separate new_connection_applications table for basic submission
    }

    // Create notification if user is logged in
    if (req.user?.id) {
      try {
        await connection.query(
          `INSERT INTO notifications (user_id, title, message, type) 
           VALUES (?, ?, ?, ?)`,
          [req.user.id, 'Application Submitted', 
           `Your ${application_type.replace(/_/g, ' ')} application ${applicationNumber} has been submitted successfully.`,
           'success']
        );
      } catch (notificationError) {
        console.error('Notification creation failed:', notificationError.message);
        // Continue without notification, as it's not critical
      }
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      application_number: applicationNumber,
      application_id: applicationId,
      reference: `Use "${applicationNumber}" to track your application status`,
      status: 'submitted',
      next_steps: 'Your application has been submitted for review. Admin will process it and send you updates. You will receive your customer ID after approval.',
      tracking_info: {
        application_number: applicationNumber,
        submittedAt: new Date().toISOString(),
        estimatedReviewDays: '3-5 business days'
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Submit application error:', error.message);
    console.error('Full error:', error);
    res.status(500).json({ error: 'Failed to submit application', details: error.message });
  } finally {
    connection.release();
  }
});

// Get user's applications
router.get('/my-applications', verifyToken, async (req, res) => {
  try {
    const [applications] = await promisePool.query(
      `SELECT id, application_number, application_type, application_status, 
              applicant_name, mobile, email, submitted_at
       FROM applications 
       WHERE mobile = ? 
       ORDER BY submitted_at DESC`,
      [req.user.mobile]
    );

    res.json({
      success: true,
      applications: applications
    });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// Get application by number
router.get('/:applicationNumber', verifyToken, async (req, res) => {
  try {
    const [applications] = await promisePool.query(
      `SELECT id, application_number, applicant_name, mobile, email, state, city, 
              pincode, address, service_type, application_type, application_status, 
              documents, remarks, submitted_at
       FROM applications 
       WHERE application_number = ?`,
      [req.params.applicationNumber]
    );

    if (applications.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const application = {
      ...applications[0],
      documents: applications[0].documents 
        ? (typeof applications[0].documents === 'string' ? JSON.parse(applications[0].documents) : applications[0].documents)
        : []
    };

    res.json({
      success: true,
      application: application
    });
  } catch (error) {
    console.error('Get application error:', error);
    res.status(500).json({ error: 'Failed to fetch application' });
  }
});

// Track application status
router.get('/track/:applicationNumber', async (req, res) => {
  try {
    const [applications] = await promisePool.query(
      `SELECT application_number, application_type, application_status,
              submitted_at, remarks, applicant_name, mobile
       FROM applications 
       WHERE application_number = ?`,
      [req.params.applicationNumber]
    );

    if (applications.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const application = applications[0];
    res.json({
      success: true,
      application: {
        application_number: application.application_number,
        application_type: application.application_type,
        status: application.application_status,
        applicant_name: application.applicant_name,
        mobile: application.mobile,
        submitted_at: application.submitted_at,
        remarks: application.remarks
      }
    });
  } catch (error) {
    console.error('Track application error:', error);
    res.status(500).json({ error: 'Failed to track application' });
  }
});

// Upload documents for an application (Admin only)
router.post('/:id/documents', upload.array('documents', 10), async (req, res) => {
  try {
    const applicationId = req.params.id;
    
    // Get existing documents
    const [applications] = await promisePool.query(
      'SELECT documents FROM applications WHERE id = ?',
      [applicationId]
    );

    if (applications.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Parse existing documents
    let existingDocuments = [];
    if (applications[0].documents) {
      existingDocuments = typeof applications[0].documents === 'string'
        ? JSON.parse(applications[0].documents)
        : applications[0].documents;
    }

    // Add new documents
    const newDocuments = req.files.map(file => ({
      name: file.originalname,
      type: file.mimetype,
      size: file.size,
      path: file.path,
      url: `/uploads/documents/${file.filename}`,
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'admin'
    }));

    const allDocuments = [...existingDocuments, ...newDocuments];

    // Update database
    await promisePool.query(
      'UPDATE applications SET documents = ? WHERE id = ?',
      [JSON.stringify(allDocuments), applicationId]
    );

    res.json({
      message: 'Documents uploaded successfully',
      documents: allDocuments
    });
  } catch (error) {
    console.error('Upload documents error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload documents' });
  }
});

module.exports = router;
