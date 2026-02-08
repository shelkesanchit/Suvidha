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
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array(), error: errors.array()[0]?.msg });
    }

    const { 
      consumer_number, complaint_category, complaint_type, description, priority,
      full_name, father_husband_name, mobile, alternate_mobile, email,
      address, landmark, city, district, state, pincode,
      is_consumer, consumer_name, subject, affected_since,
      location_details, nearby_transformer, pole_number, documents
    } = req.body;

    let customerId = null;

    // Verify electricity customer if consumer_number provided
    if (consumer_number) {
      const [customers] = await promisePool.query(
        'SELECT id FROM electricity_customers WHERE consumer_id = ? OR id = ?',
        [consumer_number, consumer_number]
      );

      if (customers.length > 0) {
        customerId = customers[0].id;
      }
    }

    // Generate complaint number
    const year = new Date().getFullYear();
    const [countResult] = await promisePool.query(
      'SELECT COUNT(*) as count FROM complaints WHERE YEAR(created_at) = ?',
      [year]
    );
    const complaintNumber = `CMP${year}${String(countResult[0].count + 1).padStart(6, '0')}`;

    // Auto-assign priority based on complaint category
    let assignedPriority = priority || 'medium';
    const priorityMap = { low: 'low', medium: 'medium', high: 'high', critical: 'urgent' };
    assignedPriority = priorityMap[assignedPriority] || 'medium';

    if (complaint_category === 'supply_related') {
      assignedPriority = 'high';
    } else if (complaint_category === 'meter_related' && complaint_type?.includes('Burnt')) {
      assignedPriority = 'urgent';
    }

    // Insert complaint with actual table columns
    const [result] = await promisePool.query(
      `INSERT INTO complaints 
       (complaint_number, customer_name, customer_mobile, customer_id, service_type, complaint_type, description, 
        priority, complaint_status, attachment_url) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open', ?)`,
      [
        complaintNumber, 
        full_name, 
        mobile, 
        customerId,
        'electricity',  // service_type is electricity for this endpoint
        complaint_type,
        `${complaint_category}: ${description}`,  // Combine category with description
        assignedPriority,
        location_details || ''  // Store location in attachment_url since there's no dedicated field
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully',
      complaint_number: complaintNumber,
      complaint_id: result.insertId
    });
  } catch (error) {
    console.error('Submit complaint error:', error.message);
    console.error('SQL Error Code:', error.code);
    console.error('SQL:', error.sql);
    res.status(500).json({ error: 'Failed to submit complaint', details: error.message });
  }
});

// Get user's complaints
router.get('/my-complaints', verifyToken, async (req, res) => {
  try {
    // Get the user's phone number to match against complaint records
    const [users] = await promisePool.query(
      'SELECT phone FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0 || !users[0].phone) {
      return res.json([]);
    }

    const [complaints] = await promisePool.query(
      `SELECT c.*, ec.consumer_id
       FROM complaints c
       LEFT JOIN electricity_customers ec ON c.customer_id = ec.id
       WHERE c.customer_mobile = ?
       ORDER BY c.created_at DESC`,
      [users[0].phone]
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
      `SELECT c.complaint_number, c.complaint_type, c.priority, c.complaint_status as status,
              c.description, c.resolution_notes, c.created_at as submitted_at, c.resolved_at, c.customer_name,
              c.customer_mobile, c.assigned_to
       FROM complaints c
       WHERE c.complaint_number = ?`,
      [req.params.complaintNumber]
    );

    if (complaints.length === 0) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    const complaint = complaints[0];
    res.json({
      success: true,
      complaint: {
        complaint_number: complaint.complaint_number,
        complaint_type: complaint.complaint_type,
        priority: complaint.priority,
        status: complaint.status,
        description: complaint.description,
        resolution_notes: complaint.resolution_notes,
        submitted_at: complaint.submitted_at,
        resolved_at: complaint.resolved_at,
        customer_name: complaint.customer_name,
        customer_mobile: complaint.customer_mobile,
        assigned_to: complaint.assigned_to
      }
    });
  } catch (error) {
    console.error('Track complaint error:', error);
    res.status(500).json({ error: 'Failed to track complaint' });
  }
});

// Get complaint details
router.get('/:complaintNumber', verifyToken, async (req, res) => {
  try {
    // Get the user's phone number to verify ownership
    const [users] = await promisePool.query(
      'SELECT phone FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const [complaints] = await promisePool.query(
      `SELECT c.*, ec.consumer_id
       FROM complaints c
       LEFT JOIN electricity_customers ec ON c.customer_id = ec.id
       WHERE c.complaint_number = ? AND c.customer_mobile = ?`,
      [req.params.complaintNumber, users[0].phone]
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
