const express = require('express');
const router = express.Router();
const { promisePool } = require('../../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// =====================================================
// GAS ADMIN ROUTES
// =====================================================

// Admin Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const [users] = await promisePool.query(
      'SELECT * FROM gas_admin_users WHERE username = ? AND status = ?',
      [username, 'active']
    );
    
    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    // Update last login
    await promisePool.query(
      'UPDATE gas_admin_users SET last_login = NOW() WHERE id = ?',
      [user.id]
    );
    
    // Generate token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'gas_admin_secret_key',
      { expiresIn: '8h' }
    );
    
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          full_name: user.full_name,
          role: user.role,
          email: user.email
        }
      }
    });
    
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Dashboard Stats
router.get('/dashboard/stats', async (req, res) => {
  try {
    // Get counts
    const [[{ consumersCount }]] = await promisePool.query(
      'SELECT COUNT(*) as consumersCount FROM gas_consumers'
    );
    const [[{ applicationsCount }]] = await promisePool.query(
      "SELECT COUNT(*) as applicationsCount FROM gas_applications WHERE status != 'completed'"
    );
    const [[{ complaintsCount }]] = await promisePool.query(
      "SELECT COUNT(*) as complaintsCount FROM gas_complaints WHERE status NOT IN ('closed', 'resolved')"
    );
    const [[{ pendingPayments }]] = await promisePool.query(
      "SELECT COALESCE(SUM(total_amount - amount_paid), 0) as pendingPayments FROM gas_bills WHERE payment_status != 'paid'"
    );
    
    // Recent applications
    const [recentApplications] = await promisePool.query(
      `SELECT application_number, full_name, application_type, gas_type, status, submitted_at
       FROM gas_applications
       ORDER BY submitted_at DESC
       LIMIT 5`
    );
    
    // Recent complaints
    const [recentComplaints] = await promisePool.query(
      `SELECT complaint_number, contact_name, complaint_category, urgency, status, created_at
       FROM gas_complaints
       ORDER BY created_at DESC
       LIMIT 5`
    );
    
    res.json({
      success: true,
      data: {
        stats: {
          total_consumers: consumersCount,
          pending_applications: applicationsCount,
          open_complaints: complaintsCount,
          pending_payments: pendingPayments
        },
        recent_applications: recentApplications,
        recent_complaints: recentComplaints
      }
    });
    
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all applications
router.get('/applications', async (req, res) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = 'SELECT * FROM gas_applications WHERE 1=1';
    const params = [];
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (type) {
      query += ' AND application_type = ?';
      params.push(type);
    }
    
    query += ' ORDER BY submitted_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    const [applications] = await promisePool.query(query, params);
    
    // Get total count
    const [[{ total }]] = await promisePool.query(
      'SELECT COUNT(*) as total FROM gas_applications'
    );
    
    res.json({
      success: true,
      data: applications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update application status
router.put('/applications/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, current_stage, remarks, assigned_engineer } = req.body;
    
    // Get current application
    const [apps] = await promisePool.query(
      'SELECT stage_history FROM gas_applications WHERE id = ?',
      [id]
    );
    
    if (apps.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    
    let stageHistory = [];
    if (apps[0].stage_history) {
      stageHistory = typeof apps[0].stage_history === 'string' 
        ? JSON.parse(apps[0].stage_history) 
        : apps[0].stage_history;
    }
    
    stageHistory.push({
      stage: current_stage || status,
      status,
      timestamp: new Date().toISOString(),
      remarks: remarks || `Status updated to ${status}`
    });
    
    await promisePool.query(
      `UPDATE gas_applications 
       SET status = ?, current_stage = ?, stage_history = ?, remarks = ?, assigned_engineer = ?,
           processed_at = CASE WHEN status = 'document_verification' THEN NOW() ELSE processed_at END,
           completed_at = CASE WHEN status = 'completed' THEN NOW() ELSE completed_at END
       WHERE id = ?`,
      [status, current_stage || status, JSON.stringify(stageHistory), remarks, assigned_engineer, id]
    );
    
    res.json({ success: true, message: 'Application updated successfully' });
    
  } catch (error) {
    console.error('Update application error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all complaints
router.get('/complaints', async (req, res) => {
  try {
    const { status, category, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = 'SELECT * FROM gas_complaints WHERE 1=1';
    const params = [];
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (category) {
      query += ' AND complaint_category = ?';
      params.push(category);
    }
    
    query += ' ORDER BY priority ASC, created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    const [complaints] = await promisePool.query(query, params);
    
    const [[{ total }]] = await promisePool.query(
      'SELECT COUNT(*) as total FROM gas_complaints'
    );
    
    res.json({
      success: true,
      data: complaints,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Get complaints error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update complaint status
router.put('/complaints/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolution_notes, assigned_engineer } = req.body;
    
    const updateFields = ['status = ?'];
    const params = [status];
    
    if (resolution_notes) {
      updateFields.push('resolution_notes = ?');
      params.push(resolution_notes);
    }
    if (assigned_engineer) {
      updateFields.push('assigned_engineer = ?');
      params.push(assigned_engineer);
    }
    if (status === 'resolved') {
      updateFields.push('resolved_at = NOW()');
    }
    if (status === 'closed') {
      updateFields.push('closed_at = NOW()');
    }
    
    params.push(id);
    
    await promisePool.query(
      `UPDATE gas_complaints SET ${updateFields.join(', ')} WHERE id = ?`,
      params
    );
    
    res.json({ success: true, message: 'Complaint updated successfully' });
    
  } catch (error) {
    console.error('Update complaint error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all consumers
router.get('/consumers', async (req, res) => {
  try {
    const { status, gas_type, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = 'SELECT * FROM gas_consumers WHERE 1=1';
    const params = [];
    
    if (status) {
      query += ' AND connection_status = ?';
      params.push(status);
    }
    if (gas_type) {
      query += ' AND gas_type = ?';
      params.push(gas_type);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    const [consumers] = await promisePool.query(query, params);
    
    const [[{ total }]] = await promisePool.query(
      'SELECT COUNT(*) as total FROM gas_consumers'
    );
    
    res.json({
      success: true,
      data: consumers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Get consumers error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get tariffs
router.get('/tariffs', async (req, res) => {
  try {
    const [tariffs] = await promisePool.query(
      'SELECT * FROM gas_tariffs WHERE is_active = TRUE ORDER BY category'
    );
    
    res.json({ success: true, data: tariffs });
    
  } catch (error) {
    console.error('Get tariffs error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update tariff
router.put('/tariffs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const updateFields = [];
    const params = [];
    
    for (const [key, value] of Object.entries(updates)) {
      if (key !== 'id') {
        updateFields.push(`${key} = ?`);
        params.push(value);
      }
    }
    
    params.push(id);
    
    await promisePool.query(
      `UPDATE gas_tariffs SET ${updateFields.join(', ')} WHERE id = ?`,
      params
    );
    
    res.json({ success: true, message: 'Tariff updated successfully' });
    
  } catch (error) {
    console.error('Update tariff error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get cylinder bookings
router.get('/cylinder-bookings', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = 'SELECT * FROM gas_cylinder_bookings WHERE 1=1';
    const params = [];
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY booked_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    const [bookings] = await promisePool.query(query, params);
    
    res.json({ success: true, data: bookings });
    
  } catch (error) {
    console.error('Get cylinder bookings error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// =====================================================
// REGULATORY OPERATIONS - ADMIN ONLY (Not available on Kiosk)
// =====================================================

// De-duplication check - verify Aadhaar/LPG ID uniqueness
router.get('/regulatory/deduplication', async (req, res) => {
  try {
    const { search } = req.query;
    
    // Get consumers grouped by aadhaar to find duplicates
    const [results] = await promisePool.query(`
      SELECT 
        CONCAT('****', RIGHT(aadhaar_number, 4)) as masked_aadhaar,
        full_name,
        COUNT(*) as connection_count,
        CASE 
          WHEN COUNT(*) > 1 THEN 'flagged'
          ELSE 'clear'
        END as status,
        MAX(created_at) as last_check_date
      FROM gas_consumers
      WHERE aadhaar_number IS NOT NULL
      GROUP BY aadhaar_number
      HAVING COUNT(*) >= 1
      ORDER BY connection_count DESC
      LIMIT 50
    `);
    
    res.json({ success: true, data: results });
  } catch (error) {
    console.error('De-duplication check error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PAHAL subsidy records
router.get('/regulatory/pahal', async (req, res) => {
  try {
    const [results] = await promisePool.query(`
      SELECT 
        c.consumer_number,
        c.full_name,
        CONCAT(c.bank_name, ' ****', RIGHT(c.bank_account, 4)) as bank_info,
        CASE WHEN c.bank_verified = 1 THEN 'active' ELSE 'pending' END as pahal_status,
        COALESCE((SELECT SUM(subsidy_amount) FROM gas_payments WHERE consumer_id = c.id), 0) as total_subsidy
      FROM gas_consumers c
      WHERE c.connection_status = 'active'
      ORDER BY c.created_at DESC
      LIMIT 50
    `);
    
    res.json({ success: true, data: results });
  } catch (error) {
    console.error('PAHAL records error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// DAC (15-day rule) validation
router.get('/regulatory/dac', async (req, res) => {
  try {
    const [results] = await promisePool.query(`
      SELECT 
        c.consumer_number,
        c.full_name,
        cb.booked_at as last_refill_date,
        DATEDIFF(NOW(), cb.booked_at) as days_elapsed,
        CASE WHEN DATEDIFF(NOW(), cb.booked_at) >= 15 THEN 1 ELSE 0 END as can_book
      FROM gas_consumers c
      LEFT JOIN (
        SELECT consumer_number, MAX(booked_at) as booked_at
        FROM gas_cylinder_bookings
        WHERE status IN ('delivered', 'booked', 'dispatched')
        GROUP BY consumer_number
      ) cb ON c.consumer_number = cb.consumer_number
      WHERE c.connection_status = 'active'
      ORDER BY cb.booked_at DESC
      LIMIT 50
    `);
    
    res.json({ success: true, data: results });
  } catch (error) {
    console.error('DAC check error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Cylinder testing schedule
router.get('/regulatory/cylinder-testing', async (req, res) => {
  try {
    // In production, this would come from cylinder inventory table
    // For now, return mock structure
    const results = [
      { cylinder_id: 'CYL-001', last_test: '2023-06-15', next_due: '2025-06-15', status: 'valid' },
      { cylinder_id: 'CYL-002', last_test: '2022-03-20', next_due: '2024-03-20', status: 'due' },
    ];
    
    res.json({ success: true, data: results });
  } catch (error) {
    console.error('Cylinder testing error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Inspection schedules
router.get('/regulatory/inspections', async (req, res) => {
  try {
    // Would query inspection_schedules table
    const [results] = await promisePool.query(`
      SELECT 
        a.consumer_number,
        a.application_type as inspection_type,
        a.submitted_at as scheduled_date,
        CASE a.status 
          WHEN 'completed' THEN 'completed'
          WHEN 'site_inspection' THEN 'scheduled'
          ELSE 'pending'
        END as inspection_status
      FROM gas_applications a
      WHERE a.status IN ('site_inspection', 'completed', 'approved')
      ORDER BY a.submitted_at DESC
      LIMIT 20
    `);
    
    res.json({ success: true, data: results });
  } catch (error) {
    console.error('Inspections error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Income eligibility stats (PMUY)
router.get('/regulatory/income-eligibility', async (req, res) => {
  try {
    const [[stats]] = await promisePool.query(`
      SELECT 
        COUNT(CASE WHEN connection_type = 'pmuy' AND status = 'approved' THEN 1 END) as pmuy_approved,
        COUNT(CASE WHEN connection_type = 'pmuy' AND status = 'submitted' THEN 1 END) as pmuy_pending,
        COUNT(CASE WHEN connection_type = 'pmuy' AND status = 'rejected' THEN 1 END) as pmuy_rejected
      FROM gas_applications
      WHERE connection_type = 'pmuy'
    `);
    
    res.json({ 
      success: true, 
      data: {
        approved: stats.pmuy_approved || 0,
        pending: stats.pmuy_pending || 0,
        rejected: stats.pmuy_rejected || 0
      }
    });
  } catch (error) {
    console.error('Income eligibility error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Insurance summary
router.get('/regulatory/insurance', async (req, res) => {
  try {
    const [[stats]] = await promisePool.query(`
      SELECT 
        COUNT(*) as total_consumers,
        COUNT(CASE WHEN connection_status = 'active' THEN 1 END) as active_coverage
      FROM gas_consumers
    `);
    
    res.json({ 
      success: true, 
      data: {
        death_coverage: 200000,
        property_coverage: 50000,
        total_consumers: stats.total_consumers || 0,
        active_coverage_percent: stats.total_consumers ? 
          Math.round((stats.active_coverage / stats.total_consumers) * 100) : 0
      }
    });
  } catch (error) {
    console.error('Insurance stats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
