const express = require('express');
const router = express.Router();
const { promisePool } = require('../../config/database');

// =====================================================
// MUNICIPAL ADMIN ROUTES
// =====================================================

// Dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    let stats = {
      total_applications: 0,
      pending_applications: 0,
      total_complaints: 0,
      open_complaints: 0,
      total_revenue: 0,
    };

    try {
      const [[appTotal]] = await promisePool.query('SELECT COUNT(*) as c FROM municipal_applications');
      const [[appPending]] = await promisePool.query("SELECT COUNT(*) as c FROM municipal_applications WHERE status = 'pending'");
      const [[cmpTotal]] = await promisePool.query('SELECT COUNT(*) as c FROM municipal_complaints');
      const [[cmpOpen]] = await promisePool.query("SELECT COUNT(*) as c FROM municipal_complaints WHERE status = 'open'");
      const [[revenue]] = await promisePool.query("SELECT COALESCE(SUM(amount),0) as total FROM municipal_payments WHERE status = 'success'");

      stats = {
        total_applications: appTotal.c,
        pending_applications: appPending.c,
        total_complaints: cmpTotal.c,
        open_complaints: cmpOpen.c,
        total_revenue: revenue.total,
      };
    } catch (_) {}

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Municipal admin dashboard error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// List all applications (with pagination)
router.get('/applications', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status || null;

    let query = `SELECT application_number, application_type, applicant_name, mobile, status, submitted_at
                 FROM municipal_applications`;
    const params = [];
    if (status) { query += ' WHERE status = ?'; params.push(status); }
    query += ' ORDER BY submitted_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await promisePool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Municipal admin list applications error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update application status
router.put('/applications/:applicationNumber/status', async (req, res) => {
  try {
    const { applicationNumber } = req.params;
    const { status, remarks } = req.body;

    await promisePool.query(
      `UPDATE municipal_applications SET status = ?, remarks = ?, updated_at = NOW() WHERE application_number = ?`,
      [status, remarks || null, applicationNumber]
    );

    res.json({ success: true, message: 'Status updated' });
  } catch (error) {
    console.error('Update municipal application status error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// List all complaints
router.get('/complaints', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const [rows] = await promisePool.query(
      `SELECT complaint_number, contact_name, department, complaint_type, urgency, status, created_at
       FROM municipal_complaints ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Municipal admin list complaints error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
