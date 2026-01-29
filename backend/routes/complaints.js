const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { promisePool } = require('../config/database');
const { verifyToken } = require('../middleware/auth');

// Submit complaint
router.post('/submit', [
  body('complaint_category').notEmpty().withMessage('Complaint category is required'),
  body('complaint_type').notEmpty().withMessage('Complaint type is required'),
  body('description').notEmpty().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('full_name').notEmpty().withMessage('Full name is required'),
  body('mobile').notEmpty().isLength({ min: 10, max: 10 }).withMessage('Valid mobile number is required'),
], async (req, res) => {
  const connection = await promisePool.getConnection();
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array(), error: errors.array()[0]?.msg });
    }

    await connection.beginTransaction();

    const { 
      consumer_number, complaint_category, complaint_type, description, priority,
      full_name, father_husband_name, mobile, alternate_mobile, email,
      address, landmark, city, district, state, pincode,
      is_consumer, consumer_name, subject, affected_since,
      location_details, nearby_transformer, pole_number, documents
    } = req.body;

    let consumerAccountId = null;
    let userId = req.user?.id || null;

    // Verify consumer account if provided
    if (consumer_number) {
      const [accounts] = await connection.query(
        'SELECT id FROM consumer_accounts WHERE consumer_number = ?',
        [consumer_number]
      );

      if (accounts.length > 0) {
        consumerAccountId = accounts[0].id;
      }
    }

    // Generate complaint number
    const year = new Date().getFullYear();
    const [countResult] = await connection.query(
      'SELECT COUNT(*) as count FROM complaints WHERE YEAR(submitted_at) = ?',
      [year]
    );
    const complaintNumber = `CMP${year}${String(countResult[0].count + 1).padStart(6, '0')}`;

    // Auto-assign priority based on complaint category
    let assignedPriority = priority || 'medium';
    if (complaint_category === 'supply_related') {
      assignedPriority = 'high';
    } else if (complaint_category === 'meter_related' && complaint_type?.includes('Burnt')) {
      assignedPriority = 'critical';
    }

    // Store complaint data as JSON
    const complaintData = {
      full_name, father_husband_name, mobile, alternate_mobile, email,
      address, landmark, city, district, state, pincode,
      is_consumer, consumer_name, subject, affected_since,
      location_details, nearby_transformer, pole_number,
      complaint_category, complaint_type
    };

    // Initialize stage history
    const stageHistory = [{
      stage: 'Complaint Registered',
      status: 'open',
      timestamp: new Date().toISOString(),
      remarks: 'Complaint registered successfully'
    }];

    // Insert complaint
    const [result] = await connection.query(
      `INSERT INTO complaints 
       (complaint_number, consumer_account_id, user_id, complaint_type, priority, description, location, status, stage_history, complaint_data, documents) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'open', ?, ?, ?)`,
      [complaintNumber, consumerAccountId, userId, `${complaint_category}:${complaint_type}`, assignedPriority, 
       description, location_details || '', JSON.stringify(stageHistory), JSON.stringify(complaintData),
       documents ? JSON.stringify(documents) : null]
    );

    // Create notification if user is logged in
    if (userId) {
      await connection.query(
        `INSERT INTO notifications (user_id, title, message, type) 
         VALUES (?, ?, ?, ?)`,
        [userId, 'Complaint Registered', 
         `Your complaint ${complaintNumber} has been registered successfully. We will address it soon.`,
         'info']
      );
    }

    await connection.commit();

    res.status(201).json({
      message: 'Complaint submitted successfully',
      complaint_number: complaintNumber,
      complaint_id: result.insertId
    });
  } catch (error) {
    await connection.rollback();
    console.error('Submit complaint error:', error.message);
    console.error('SQL Error Code:', error.code);
    console.error('SQL:', error.sql);
    res.status(500).json({ error: 'Failed to submit complaint', details: error.message });
  } finally {
    connection.release();
  }
});

// Get user's complaints
router.get('/my-complaints', verifyToken, async (req, res) => {
  try {
    const [complaints] = await promisePool.query(
      `SELECT c.*, ca.consumer_number
       FROM complaints c
       JOIN consumer_accounts ca ON c.consumer_account_id = ca.id
       WHERE ca.user_id = ?
       ORDER BY c.submitted_at DESC`,
      [req.user.id]
    );

    res.json(complaints);
  } catch (error) {
    console.error('Get complaints error:', error);
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
});

// Track complaint status
router.get('/track/:complaintNumber', async (req, res) => {
  try {
    const [complaints] = await promisePool.query(
      `SELECT c.complaint_number, c.complaint_type, c.priority, c.status, 
              c.description, c.resolution_notes, c.submitted_at, c.resolved_at, c.stage_history,
              ca.consumer_number
       FROM complaints c
       LEFT JOIN consumer_accounts ca ON c.consumer_account_id = ca.id
       WHERE c.complaint_number = ?`,
      [req.params.complaintNumber]
    );

    if (complaints.length === 0) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    const complaint = complaints[0];
    res.json({
      ...complaint,
      stage_history: complaint.stage_history 
        ? (typeof complaint.stage_history === 'string' ? JSON.parse(complaint.stage_history) : complaint.stage_history)
        : []
    });
  } catch (error) {
    console.error('Track complaint error:', error);
    res.status(500).json({ error: 'Failed to track complaint' });
  }
});

// Get complaint details
router.get('/:complaintNumber', verifyToken, async (req, res) => {
  try {
    const [complaints] = await promisePool.query(
      `SELECT c.*, ca.consumer_number, u.full_name as assigned_to_name
       FROM complaints c
       JOIN consumer_accounts ca ON c.consumer_account_id = ca.id
       LEFT JOIN users u ON c.assigned_to = u.id
       WHERE c.complaint_number = ? AND ca.user_id = ?`,
      [req.params.complaintNumber, req.user.id]
    );

    if (complaints.length === 0) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    res.json(complaints[0]);
  } catch (error) {
    console.error('Get complaint error:', error);
    res.status(500).json({ error: 'Failed to fetch complaint' });
  }
});

module.exports = router;
