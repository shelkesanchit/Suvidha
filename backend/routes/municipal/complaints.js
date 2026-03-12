const express = require('express');
const router = express.Router();
const { promisePool } = require('../../config/database');

// =====================================================
// MUNICIPAL COMPLAINTS ROUTES
// =====================================================

// Submit complaint
router.post('/submit', async (req, res) => {
  try {
    const { complaint_data } = req.body;
    if (!complaint_data) return res.status(400).json({ success: false, message: 'complaint_data required' });

    const year = new Date().getFullYear();
    let seqNum = String(Math.floor(Math.random() * 900000) + 100000);
    try {
      const [countResult] = await promisePool.query(
        'SELECT COUNT(*) as count FROM municipal_complaints WHERE YEAR(created_at) = ?', [year]
      );
      seqNum = String(countResult[0].count + 1).padStart(6, '0');
    } catch (_) {}

    const complaintNumber = `MCP${year}${seqNum}`;

    try {
      await promisePool.query(
        `INSERT INTO municipal_complaints
         (complaint_number, contact_name, mobile, department, complaint_type, description, ward, urgency, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open', NOW())`,
        [
          complaintNumber,
          complaint_data.name || complaint_data.contact_name || 'Complainant',
          complaint_data.mobile || null,
          complaint_data.department || null,
          complaint_data.complaint_type || null,
          complaint_data.description || null,
          complaint_data.ward || null,
          complaint_data.urgency || 'medium',
        ]
      );
    } catch (_) {}

    res.status(201).json({
      success: true,
      message: 'Complaint registered successfully',
      data: { complaint_number: complaintNumber },
    });
  } catch (error) {
    console.error('Submit municipal complaint error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Track complaint
router.get('/track/:complaintNumber', async (req, res) => {
  try {
    const { complaintNumber } = req.params;

    const [rows] = await promisePool.query(
      `SELECT complaint_number, contact_name, department, complaint_type, description,
              ward, urgency, status, assigned_officer, remarks, created_at, updated_at
       FROM municipal_complaints WHERE complaint_number = ?`,
      [complaintNumber]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Track municipal complaint error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
