const express = require('express');
const router = express.Router();
const { promisePool } = require('../../config/database');

// =====================================================
// GAS COMPLAINTS ROUTES
// Fixed to match actual gas_complaints schema:
//   id, complaint_number, customer_id, complaint_type, description,
//   attachment_url, status, priority, assigned_to, created_at,
//   resolved_at, resolution_notes
// =====================================================

// Submit new complaint
router.post('/submit', async (req, res) => {
  try {
    const { complaint_data } = req.body;

    // Generate complaint number
    const year = new Date().getFullYear();
    const [countResult] = await promisePool.query(
      'SELECT COUNT(*) as count FROM gas_complaints WHERE YEAR(created_at) = ?',
      [year]
    );
    const complaintNumber = `GCP${year}${String(countResult[0].count + 1).padStart(6, '0')}`;

    // Check if customer exists by consumer_id
    let customerId = null;

    if (complaint_data.consumer_id) {
      const [customers] = await promisePool.query(
        'SELECT id, full_name FROM gas_customers WHERE consumer_id = ?',
        [complaint_data.consumer_id]
      );
      if (customers.length > 0) {
        customerId = customers[0].id;
      }
    }

    // If no customer found, try lookup by mobile
    if (!customerId && complaint_data.mobile) {
      const [customers] = await promisePool.query(
        'SELECT id, full_name FROM gas_customers WHERE mobile = ?',
        [complaint_data.mobile]
      );
      if (customers.length > 0) {
        customerId = customers[0].id;
      }
    }

    // Map complaint_category / urgency to actual enum values
    const typeMap = {
      'delivery': 'delivery_issue', 'delivery_issue': 'delivery_issue',
      'billing': 'billing', 'safety': 'safety', 'gas-leak': 'safety',
      'quality': 'quality', 'other': 'other'
    };
    const complaintType = typeMap[complaint_data.complaint_category] || 'other';

    const priorityMap = { 'critical': 'urgent', 'high': 'high', 'medium': 'medium', 'low': 'low' };
    const priority = priorityMap[complaint_data.urgency] || 'medium';

    // Insert complaint (only columns that exist in gas_complaints)
    const [result] = await promisePool.query(
      `INSERT INTO gas_complaints 
      (complaint_number, customer_id, complaint_type, description, status, priority) 
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        complaintNumber,
        customerId,
        complaintType,
        complaint_data.description,
        'open',
        priority
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Complaint registered successfully',
      data: {
        complaint_number: complaintNumber,
        complaint_id: result.insertId
      }
    });

  } catch (error) {
    console.error('Submit gas complaint error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Track complaint status
router.get('/track/:complaintNumber', async (req, res) => {
  try {
    const { complaintNumber } = req.params;

    const [complaints] = await promisePool.query(
      `SELECT gc.complaint_number, gc.customer_id, gc.complaint_type,
              gc.description, gc.status, gc.priority, gc.assigned_to,
              gc.resolution_notes, gc.created_at, gc.resolved_at,
              c.full_name, c.mobile, c.email, c.address
       FROM gas_complaints gc
       LEFT JOIN gas_customers c ON gc.customer_id = c.id
       WHERE gc.complaint_number = ?`,
      [complaintNumber]
    );

    if (complaints.length === 0) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    res.json({ success: true, data: complaints[0] });

  } catch (error) {
    console.error('Track complaint error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get user's complaints by mobile
router.get('/my-complaints/:mobile', async (req, res) => {
  try {
    const { mobile } = req.params;

    const [complaints] = await promisePool.query(
      `SELECT gc.id, gc.complaint_number, gc.complaint_type, gc.status, gc.priority,
              gc.created_at, gc.resolved_at
       FROM gas_complaints gc
       INNER JOIN gas_customers c ON gc.customer_id = c.id
       WHERE c.mobile = ?
       ORDER BY gc.created_at DESC`,
      [mobile]
    );

    res.json({ success: true, data: complaints });

  } catch (error) {
    console.error('Get my complaints error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Report gas leak (Emergency)
router.post('/emergency-leak', async (req, res) => {
  try {
    const { contact_name, mobile, address, landmark, description } = req.body;

    // Generate complaint number
    const year = new Date().getFullYear();
    const [countResult] = await promisePool.query(
      'SELECT COUNT(*) as count FROM gas_complaints WHERE YEAR(created_at) = ?',
      [year]
    );
    const complaintNumber = `GLEAK${year}${String(countResult[0].count + 1).padStart(6, '0')}`;

    // Try to find customer by mobile
    let customerId = null;
    if (mobile) {
      const [customers] = await promisePool.query(
        'SELECT id FROM gas_customers WHERE mobile = ?',
        [mobile]
      );
      if (customers.length > 0) {
        customerId = customers[0].id;
      }
    }

    // Insert emergency complaint (only valid columns)
    const [result] = await promisePool.query(
      `INSERT INTO gas_complaints 
      (complaint_number, customer_id, complaint_type, description, status, priority) 
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        complaintNumber,
        customerId,
        'safety',
        description || 'Gas leak reported - Emergency',
        'open',
        'urgent'
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Emergency gas leak reported! Response team will reach shortly.',
      data: {
        complaint_number: complaintNumber,
        complaint_id: result.insertId,
        priority: 'URGENT',
        estimated_response: '15-30 minutes'
      }
    });

  } catch (error) {
    console.error('Emergency leak report error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
