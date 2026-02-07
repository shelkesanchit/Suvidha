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
      return res.status(400).json({ errors: errors.array() });
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

    // Initialize stage history
    const stageHistory = [{
      stage: 'Application Submitted',
      status: 'submitted',
      timestamp: new Date().toISOString(),
      remarks: 'Application submitted successfully'
    }];

    // Insert application
    const [result] = await connection.query(
      `INSERT INTO applications 
      (application_number, user_id, application_type, application_data, documents, status, current_stage, stage_history) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [applicationNumber, req.user?.id || null, application_type, JSON.stringify(application_data), 
       JSON.stringify(documents || []), 'submitted', 'Application Submitted', JSON.stringify(stageHistory)]
    );

    const applicationId = result.insertId;

    // For new connection applications, insert into detailed table
    if (application_type === 'new_connection') {
      // Validate required fields
      const requiredFields = ['full_name', 'father_husband_name', 'date_of_birth', 'gender', 'identity_type', 'identity_number', 'email', 'mobile', 'premises_address', 'plot_number', 'district', 'city', 'state', 'pincode', 'ownership_type', 'category', 'load_type', 'required_load', 'purpose', 'supply_voltage', 'phases', 'number_of_floors', 'built_up_area'];
      const missingFields = requiredFields.filter(field => !application_data[field] || application_data[field] === '');
      
      if (missingFields.length > 0) {
        await connection.rollback();
        return res.status(400).json({ 
          success: false,
          message: `Missing required fields: ${missingFields.join(', ')}` 
        });
      }
      
      await connection.query(
        `INSERT INTO new_connection_applications 
        (application_id, full_name, father_husband_name, date_of_birth, gender, 
         identity_type, identity_number, pan_number, email, mobile, alternate_mobile,
         premises_address, landmark, plot_number, khata_number, district, city, state, pincode, ownership_type,
         category, load_type, required_load, purpose, existing_consumer_number,
         supply_voltage, phases, connected_load, number_of_floors, built_up_area) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          applicationId,
          application_data.full_name,
          application_data.father_husband_name,
          application_data.date_of_birth || null,
          application_data.gender,
          application_data.identity_type,
          application_data.identity_number,
          application_data.pan_number || null,
          application_data.email,
          application_data.mobile,
          application_data.alternate_mobile || null,
          application_data.premises_address,
          application_data.landmark || null,
          application_data.plot_number,
          application_data.khata_number || null,
          application_data.district,
          application_data.city,
          application_data.state,
          application_data.pincode,
          application_data.ownership_type,
          application_data.category,
          application_data.load_type,
          application_data.required_load,
          application_data.purpose,
          application_data.existing_consumer_number || null,
          application_data.supply_voltage,
          application_data.phases,
          application_data.connected_load || null,
          application_data.number_of_floors || 1, // Default to 1 if not provided
          application_data.built_up_area
        ]
      );
    }

    // Create notification if user is logged in
    if (req.user?.id) {
      await connection.query(
        `INSERT INTO notifications (user_id, title, message, type) 
         VALUES (?, ?, ?, ?)`,
        [req.user.id, 'Application Submitted', 
         `Your ${application_type.replace(/_/g, ' ')} application ${applicationNumber} has been submitted successfully.`,
         'success']
      );
    }

    await connection.commit();

    res.status(201).json({
      message: 'Application submitted successfully',
      application_number: applicationNumber,
      application_id: applicationId
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
      `SELECT id, application_number, application_type, status, 
              application_data, submitted_at, reviewed_at, completed_at
       FROM applications 
       WHERE user_id = ? 
       ORDER BY submitted_at DESC`,
      [req.user.id]
    );

    // Parse JSON fields
    const parsedApplications = applications.map(app => ({
      ...app,
      application_data: typeof app.application_data === 'string' 
        ? JSON.parse(app.application_data) 
        : app.application_data
    }));

    res.json(parsedApplications);
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// Get application by number
router.get('/:applicationNumber', verifyToken, async (req, res) => {
  try {
    const [applications] = await promisePool.query(
      `SELECT a.*, u.full_name as reviewed_by_name
       FROM applications a
       LEFT JOIN users u ON a.reviewed_by = u.id
       WHERE a.application_number = ? AND a.user_id = ?`,
      [req.params.applicationNumber, req.user.id]
    );

    if (applications.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const application = {
      ...applications[0],
      application_data: typeof applications[0].application_data === 'string'
        ? JSON.parse(applications[0].application_data)
        : applications[0].application_data,
      documents: applications[0].documents 
        ? (typeof applications[0].documents === 'string' ? JSON.parse(applications[0].documents) : applications[0].documents)
        : []
    };

    res.json(application);
  } catch (error) {
    console.error('Get application error:', error);
    res.status(500).json({ error: 'Failed to fetch application' });
  }
});

// Track application status
router.get('/track/:applicationNumber', async (req, res) => {
  try {
    const [applications] = await promisePool.query(
      `SELECT application_number, application_type, status, current_stage, stage_history,
              submitted_at, reviewed_at, completed_at, remarks, application_data
       FROM applications 
       WHERE application_number = ?`,
      [req.params.applicationNumber]
    );

    if (applications.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const application = applications[0];
    res.json({
      ...application,
      stage_history: application.stage_history 
        ? (typeof application.stage_history === 'string' ? JSON.parse(application.stage_history) : application.stage_history)
        : [],
      application_data: application.application_data
        ? (typeof application.application_data === 'string' ? JSON.parse(application.application_data) : application.application_data)
        : {}
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
