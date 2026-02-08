const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { verifyToken, isAdminOrStaff, isAdmin } = require('../../middleware/auth');
const dashboardController = require('../controllers/dashboardController');
const applicationController = require('../controllers/applicationController');
const complaintController = require('../controllers/complaintController');
const userController = require('../controllers/userController');
const consumerController = require('../controllers/consumerController');
const reportController = require('../controllers/reportController');
const meterReadingController = require('../controllers/meterReadingController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/documents');
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

// Dashboard Routes
router.get('/dashboard/stats', verifyToken, isAdminOrStaff, dashboardController.getDashboardStats);

// Application Routes
router.get('/applications', verifyToken, isAdminOrStaff, applicationController.getAllApplications);
router.put('/applications/:id', 
  verifyToken, 
  isAdminOrStaff, 
  [
    body('application_status').isIn([
      'submitted', 'under_review', 'approved', 'rejected', 'completed'
    ]),
    body('remarks').optional()
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  applicationController.updateApplication
);

// Document Upload Route for Applications
router.post('/applications/:id/documents', 
  verifyToken, 
  isAdminOrStaff, 
  upload.array('documents', 10),
  applicationController.uploadDocuments
);

// Complaint Routes
router.get('/complaints', verifyToken, isAdminOrStaff, complaintController.getAllComplaints);
router.put('/complaints/:id', 
  verifyToken, 
  isAdminOrStaff, 
  [
    body('status').optional().isIn(['open', 'assigned', 'in_progress', 'resolved', 'closed']),
    body('resolution_notes').optional()
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  complaintController.updateComplaint
);

// User Management Routes
router.get('/users', verifyToken, isAdmin, userController.getAllUsers);
router.post('/users/staff', 
  verifyToken, 
  isAdmin, 
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('full_name').trim().notEmpty(),
    body('phone').matches(/^[0-9]{10}$/)
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  userController.createStaffUser
);
router.patch('/users/:id/toggle-status', verifyToken, isAdmin, userController.toggleUserStatus);

// Consumer Routes
router.get('/consumers', verifyToken, isAdminOrStaff, consumerController.getConsumerAccounts);

// Meter Reading Routes
router.get('/customers', verifyToken, isAdminOrStaff, meterReadingController.getAllCustomers);
router.post('/meter-readings/submit', verifyToken, isAdminOrStaff, meterReadingController.submitMeterReading);
router.post('/meter-readings/bulk-submit', verifyToken, isAdminOrStaff, meterReadingController.submitBulkMeterReadings);
router.get('/meter-readings/history/:customerId', verifyToken, isAdminOrStaff, meterReadingController.getMeterReadingHistory);

// Report Routes
router.get('/reports/payments', verifyToken, isAdminOrStaff, reportController.getPaymentReports);
router.get('/reports/applications', verifyToken, isAdminOrStaff, reportController.getApplicationReports);
router.get('/reports/complaints', verifyToken, isAdminOrStaff, reportController.getComplaintReports);
router.get('/reports/revenue', verifyToken, isAdminOrStaff, reportController.getRevenueReports);

// General report route handler
router.get('/reports/:reportType', verifyToken, isAdminOrStaff, (req, res) => {
  res.status(404).json({ error: `Report type '${req.params.reportType}' not found` });
});

module.exports = router;
