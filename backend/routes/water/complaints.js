const express = require('express');
const router = express.Router();
const { promisePool } = require('../../config/database');

// =====================================================
// WATER COMPLAINTS ROUTES
// =====================================================

// Submit new complaint
router.post('/submit', async (req, res) => {
  try {
    const { complaint_data } = req.body;
    
    // Generate complaint number
    const year = new Date().getFullYear();
    const [countResult] = await promisePool.query(
      'SELECT COUNT(*) as count FROM water_complaints WHERE YEAR(created_at) = ?',
      [year]
    );
    const complaintNumber = `WCP${year}${String(countResult[0].count + 1).padStart(6, '0')}`;
    
    // Look up customer by consumer_id or consumer_number
    let customerId = null;
    const lookupId = complaint_data.consumer_id || complaint_data.consumer_number;
    if (lookupId) {
      const [customers] = await promisePool.query(
        'SELECT id FROM water_customers WHERE consumer_id = ? OR id = ?',
        [lookupId, lookupId]
      );
      if (customers.length > 0) {
        customerId = customers[0].id;
      }
    }
    
    // Map urgency to priority enum
    let priority = 'medium';
    if (complaint_data.urgency === 'critical') {
      priority = 'urgent';
    } else if (complaint_data.urgency === 'high') {
      priority = 'high';
    } else if (complaint_data.urgency === 'low') {
      priority = 'low';
    }
    // Also accept direct priority value
    if (complaint_data.priority) {
      priority = complaint_data.priority;
    }
    
    // Insert complaint using actual water_complaints columns
    const [result] = await promisePool.query(
      `INSERT INTO water_complaints 
      (complaint_number, customer_id, complaint_type, description, attachment_url, status, priority) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        complaintNumber,
        customerId,
        complaint_data.complaint_category || complaint_data.complaint_type || 'other',
        complaint_data.description,
        complaint_data.attachment_url || null,
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
    console.error('Submit water complaint error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Track complaint status
router.get('/track/:complaintNumber', async (req, res) => {
  try {
    const { complaintNumber } = req.params;
    
    const [complaints] = await promisePool.query(
      `SELECT c.complaint_number, c.customer_id, wc.consumer_id, wc.full_name, wc.mobile, wc.email,
              c.complaint_type, c.description, c.attachment_url,
              c.status, c.priority, c.assigned_to, c.resolution_notes,
              c.created_at, c.resolved_at
       FROM water_complaints c
       LEFT JOIN water_customers wc ON c.customer_id = wc.id
       WHERE c.complaint_number = ?`,
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

// Get user's complaints by consumer_id or customer internal id
router.get('/my-complaints/:consumerId', async (req, res) => {
  try {
    const { consumerId } = req.params;
    
    // Look up the internal id from consumer_id
    const [customers] = await promisePool.query(
      'SELECT id FROM water_customers WHERE consumer_id = ? OR id = ?',
      [consumerId, consumerId]
    );
    
    const customerId = customers.length > 0 ? customers[0].id : consumerId;
    
    const [complaints] = await promisePool.query(
      `SELECT id, complaint_number, complaint_type, status, priority, 
              created_at, resolved_at
       FROM water_complaints 
       WHERE customer_id = ?
       ORDER BY created_at DESC`,
      [customerId]
    );
    
    res.json({ success: true, data: complaints });
    
  } catch (error) {
    console.error('Get my complaints error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
