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
    
    // Check if consumer exists
    let consumerId = null;
    if (complaint_data.consumer_number) {
      const [consumers] = await promisePool.query(
        'SELECT id FROM water_customers WHERE consumer_number = ?',
        [complaint_data.consumer_number]
      );
      if (consumers.length > 0) {
        consumerId = consumers[0].id;
      }
    }
    
    // Insert complaint
    const [result] = await promisePool.query(
      `INSERT INTO water_complaints 
      (complaint_number, consumer_number, consumer_id, contact_name, mobile, email,
       address, ward, landmark, complaint_category, description, urgency, status, priority) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        complaintNumber,
        complaint_data.consumer_number || null,
        consumerId,
        complaint_data.contact_name,
        complaint_data.mobile,
        complaint_data.email || null,
        complaint_data.address || null,
        complaint_data.ward || null,
        complaint_data.landmark || null,
        complaint_data.complaint_category,
        complaint_data.description,
        complaint_data.urgency || 'medium',
        'open',
        complaint_data.urgency === 'critical' ? 1 : (complaint_data.urgency === 'high' ? 3 : 5)
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
      `SELECT complaint_number, consumer_number, contact_name, mobile, email,
              address, ward, landmark, complaint_category,
              description, urgency, status, assigned_engineer, resolution_notes,
              created_at, resolved_at, closed_at
       FROM water_complaints 
       WHERE complaint_number = ?`,
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
      `SELECT id, complaint_number, complaint_category, status, urgency, 
              created_at, resolved_at
       FROM water_complaints 
       WHERE mobile = ?
       ORDER BY created_at DESC`,
      [mobile]
    );
    
    res.json({ success: true, data: complaints });
    
  } catch (error) {
    console.error('Get my complaints error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
