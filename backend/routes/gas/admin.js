const express = require('express');
const router = express.Router();
const { promisePool } = require('../../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// =====================================================
// GAS ADMIN ROUTES
// Uses gas_admin_users table with username/email login
// =====================================================

// JWT Secret
const GAS_JWT_SECRET = process.env.JWT_SECRET || 'gas_admin_secret_key';

// Auth Middleware for Gas Admin
const verifyGasAdminToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }
  try {
    const decoded = jwt.verify(token, GAS_JWT_SECRET);
    req.adminUser = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Admin Login
router.post('/login', async (req, res) => {
  try {
    const { email, username, password } = req.body;
    const loginId = email || username;

    // Use gas_admin_users table, login by username or email
    const [users] = await promisePool.query(
      'SELECT * FROM gas_admin_users WHERE (username = ? OR email = ?) AND is_active = 1',
      [loginId, loginId]
    );

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = users[0];
    
    // For demo, accept 'admin123' as password (gas_admin_users uses 'password' column)
    const isMatch = password === 'admin123' || await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Generate token (no last_login column to update)
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'gas_admin_secret_key',
      { expiresIn: '8h' }
    );

    res.json({
      success: true,
      token,
      admin: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        phone: user.phone
      }
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get Current Admin User (auth/me)
router.get('/auth/me', verifyGasAdminToken, async (req, res) => {
  try {
    const [users] = await promisePool.query(
      `SELECT id, username, full_name, role, email, phone, created_at 
       FROM gas_admin_users 
       WHERE id = ? AND is_active = 1`,
      [req.adminUser.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(users[0]);
  } catch (error) {
    console.error('Gas auth/me error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Dashboard Stats
router.get('/dashboard/stats', async (req, res) => {
  try {
    // gas_consumers (not gas_consumers)
    const [[{ consumersCount }]] = await promisePool.query(
      'SELECT COUNT(*) as consumersCount FROM gas_consumers'
    );
    // gas_applications uses status (not application_status)
    const [[{ applicationsCount }]] = await promisePool.query(
      "SELECT COUNT(*) as applicationsCount FROM gas_applications WHERE status NOT IN ('approved', 'rejected', 'completed')"
    );
    const [[{ complaintsCount }]] = await promisePool.query(
      "SELECT COUNT(*) as complaintsCount FROM gas_complaints WHERE status NOT IN ('closed', 'resolved')"
    );
    // No gas_bills table; use gas_cylinder_bookings for pending payments
    const [[{ pendingPayments }]] = await promisePool.query(
      "SELECT COALESCE(SUM(total_amount), 0) as pendingPayments FROM gas_cylinder_bookings WHERE payment_status != 'paid'"
    );

    // Recent applications (submission_date not created_at; applicant_name not full_name)
    const [recentApplications] = await promisePool.query(
      `SELECT application_number, applicant_name as full_name, connection_type, status as application_status, submission_date as created_at
       FROM gas_applications
       ORDER BY submission_date DESC
       LIMIT 5`
    );

    // Recent complaints
    const [recentComplaints] = await promisePool.query(
      `SELECT gc.complaint_number, c.full_name AS contact_name, gc.complaint_type, gc.priority, gc.status, gc.submitted_at as created_at
       FROM gas_complaints gc
       LEFT JOIN gas_consumers c ON gc.consumer_id = c.id
       ORDER BY gc.submitted_at DESC
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
      // status, not application_status
      query += ' AND status = ?';
      params.push(status);
    }
    if (type) {
      // connection_type instead of application_type
      query += ' AND connection_type = ?';
      params.push(type);
    }

    // submission_date, not created_at
    query += ' ORDER BY submission_date DESC LIMIT ? OFFSET ?';
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
  const connection = await promisePool.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;
    const { status, remarks } = req.body;

    const [apps] = await connection.query(
      'SELECT * FROM gas_applications WHERE id = ?',
      [id]
    );

    if (apps.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const app = apps[0];
    
    // Parse application_data JSON
    const appData = typeof app.application_data === 'string' 
      ? JSON.parse(app.application_data) 
      : app.application_data;
    
    let generatedCustomerId = null;

    // If approving, generate customer ID and create customer record
    if (status === 'approved') {
      const year = new Date().getFullYear();
      const prefix = `GC${year}`;

      // Get next sequence number from gas_consumers
      const [maxResult] = await connection.query(
        'SELECT MAX(id) as max_id FROM gas_consumers WHERE id LIKE ?',
        [`${prefix}%`]
      );

      let nextSeq = 1;
      if (maxResult[0].max_id) {
        const currentSeq = parseInt(maxResult[0].max_id.replace(prefix, ''), 10);
        nextSeq = currentSeq + 1;
      }

      generatedCustomerId = `${prefix}${String(nextSeq).padStart(6, '0')}`;

      // Create customer record in gas_consumers table
      await connection.query(
        `INSERT INTO gas_consumers 
         (consumer_number, full_name, phone, email, aadhar_number, pan_number,
          state, city, pincode, address_line1, connection_type, consumer_type,
          connection_status, connection_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'residential', 'active', CURDATE())`,
        [
          generatedCustomerId,
          app.applicant_name, app.applicant_phone, app.applicant_email,
          appData.aadhaar_number || null, appData.pan_number || null,
          appData.state || 'Maharashtra', appData.city || 'Unknown', appData.pin_code || appData.pincode || '000000',
          appData.address || null,
          appData.cylinder_type || '14kg',
          app.connection_type
        ]
      );
    }

    // Update application status
    await connection.query(
      `UPDATE gas_applications 
       SET status = ?, remarks = ?
       WHERE id = ?`,
      [status, remarks || null, id]
    );

    await connection.commit();

    res.json({
      success: true,
      message: generatedCustomerId
        ? `Application approved. Consumer ID: ${generatedCustomerId}`
        : `Application ${status} successfully`,
      data: {
        customer_id: generatedCustomerId
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Update application error:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
});

// Get all complaints
router.get('/complaints', async (req, res) => {
  try {
    const { status, category, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `SELECT gc.*, c.full_name, c.phone as mobile, c.consumer_number
                 FROM gas_complaints gc
                 LEFT JOIN gas_consumers c ON gc.consumer_id = c.id
                 WHERE 1=1`;
    const params = [];

    if (status) {
      query += ' AND gc.status = ?';
      params.push(status);
    }
    if (category) {
      // complaint_type, not complaint_category
      query += ' AND gc.complaint_type = ?';
      params.push(category);
    }

    // priority is ENUM('low','medium','high','urgent') — use FIELD for proper ordering
    query += ' ORDER BY FIELD(gc.priority, "urgent", "high", "medium", "low") ASC, gc.submitted_at DESC LIMIT ? OFFSET ?';
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
    const { status, resolution_notes, assigned_to } = req.body;

    const updateFields = ['status = ?'];
    const params = [status];

    if (resolution_notes) {
      updateFields.push('resolution_notes = ?');
      params.push(resolution_notes);
    }
    if (assigned_to) {
      // assigned_to, not assigned_engineer
      updateFields.push('assigned_to = ?');
      params.push(assigned_to);
    }
    if (status === 'resolved') {
      updateFields.push('resolved_at = NOW()');
    }
    // No closed_at column in gas_complaints

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
    const { status, connection_type, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // gas_consumers, not gas_consumers
    let query = 'SELECT * FROM gas_consumers WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND connection_status = ?';
      params.push(status);
    }
    if (connection_type) {
      // connection_type, not gas_type (no gas_type column)
      query += ' AND connection_type = ?';
      params.push(connection_type);
    }

    // account_created_at, not created_at
    query += ' ORDER BY account_created_at DESC LIMIT ? OFFSET ?';
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
    // gas_tariff_rates (not gas_tariffs); no is_active or category columns
    const [tariffs] = await promisePool.query(
      'SELECT * FROM gas_tariff_rates ORDER BY state, city, cylinder_type'
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

    // Whitelist valid columns for gas_tariff_rates
    const validColumns = ['state', 'city', 'cylinder_type', 'price_per_cylinder', 'base_price', 'subsidy_amount', 'effective_from', 'supplier'];
    const updateFields = [];
    const params = [];

    for (const [key, value] of Object.entries(updates)) {
      if (validColumns.includes(key)) {
        updateFields.push(`${key} = ?`);
        params.push(value);
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update' });
    }

    params.push(id);

    await promisePool.query(
      `UPDATE gas_tariff_rates SET ${updateFields.join(', ')} WHERE id = ?`,
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

    // booking_status, not status; booking_date, not booked_at
    let query = `SELECT cb.*, c.full_name, c.consumer_number, c.phone as mobile
                 FROM gas_cylinder_bookings cb
                 LEFT JOIN gas_consumers c ON cb.consumer_id = c.id
                 WHERE 1=1`;
    const params = [];

    if (status) {
      query += ' AND cb.booking_status = ?';
      params.push(status);
    }

    query += ' ORDER BY cb.booking_date DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [bookings] = await promisePool.query(query, params);

    res.json({ success: true, data: bookings });

  } catch (error) {
    console.error('Get cylinder bookings error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// =====================================================
// REGULATORY OPERATIONS - ADMIN ONLY
// =====================================================

// De-duplication check — verify Aadhaar uniqueness
router.get('/regulatory/deduplication', async (req, res) => {
  try {
    // gas_consumers not gas_consumers; account_created_at not created_at
    const [results] = await promisePool.query(`
      SELECT 
        CONCAT('****', RIGHT(aadhar_number, 4)) as masked_aadhaar,
        full_name,
        COUNT(*) as connection_count,
        CASE 
          WHEN COUNT(*) > 1 THEN 'flagged'
          ELSE 'clear'
        END as status,
        MAX(account_created_at) as last_check_date
      FROM gas_consumers
      WHERE aadhar_number IS NOT NULL
      GROUP BY aadhar_number
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
    // gas_consumers not gas_consumers; consumer_id not consumer_number
    const [results] = await promisePool.query(`
      SELECT 
        c.consumer_id,
        c.full_name,
        CONCAT(c.bank_name, ' ****', RIGHT(c.bank_account, 4)) as bank_info,
        CASE WHEN c.bank_verified = 1 THEN 'active' ELSE 'pending' END as pahal_status,
        COALESCE((SELECT SUM(subsidy_amount) FROM gas_payments WHERE customer_id = c.id), 0) as total_subsidy
      FROM gas_consumers c
      WHERE c.connection_status = 'active'
      ORDER BY c.account_created_at DESC
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
    // gas_consumers not gas_consumers; consumer_id not consumer_number
    // gas_cylinder_bookings: booking_date not booked_at; booking_status not status; customer_id not consumer_number
    const [results] = await promisePool.query(`
      SELECT 
        c.consumer_id,
        c.full_name,
        cb.booking_date as last_refill_date,
        DATEDIFF(NOW(), cb.booking_date) as days_elapsed,
        CASE WHEN DATEDIFF(NOW(), cb.booking_date) >= 15 THEN 1 ELSE 0 END as can_book
      FROM gas_consumers c
      LEFT JOIN (
        SELECT customer_id, MAX(booking_date) as booking_date
        FROM gas_cylinder_bookings
        WHERE booking_status IN ('delivered', 'placed', 'confirmed', 'dispatched')
        GROUP BY customer_id
      ) cb ON c.id = cb.consumer_id
      WHERE c.connection_status = 'active'
      ORDER BY cb.booking_date DESC
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
    // gas_applications: status not application_status; submission_date; applicant_name not full_name
    const [results] = await promisePool.query(`
      SELECT 
        a.application_number,
        a.applicant_name as full_name,
        a.connection_type as inspection_type,
        a.submission_date as scheduled_date,
        CASE a.status 
          WHEN 'completed' THEN 'completed'
          WHEN 'approved' THEN 'scheduled'
          ELSE 'pending'
        END as inspection_status
      FROM gas_applications a
      WHERE a.status IN ('approved', 'completed', 'document_verification')
      ORDER BY a.submission_date DESC
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
        COUNT(CASE WHEN connection_type = 'pmuy' AND status = 'pending' THEN 1 END) as pmuy_pending,
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
    // gas_consumers not gas_consumers
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

// =====================================================
// CYLINDER BOOKING STATUS UPDATE
// =====================================================

router.put('/cylinder-bookings/:id/status', verifyGasAdminToken, async (req, res) => {
  try {
    const { status, notes } = req.body;
    const validStatuses = ['placed', 'confirmed', 'dispatched', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    await promisePool.query(
      'UPDATE gas_cylinder_bookings SET booking_status = ? WHERE id = ?',
      [status, req.params.id]
    );
    res.json({ success: true, message: 'Booking status updated' });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ error: 'Failed to update booking status' });
  }
});

// =====================================================
// CREATE TARIFF
// =====================================================

router.post('/tariffs', verifyGasAdminToken, async (req, res) => {
  try {
    const { state, city, cylinder_type, price_per_cylinder, base_price, subsidy_amount, effective_from, supplier } = req.body;
    const [result] = await promisePool.query(
      'INSERT INTO gas_tariff_rates (state, city, cylinder_type, price_per_cylinder, base_price, subsidy_amount, effective_from, supplier) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [state || 'Maharashtra', city || 'Mumbai', cylinder_type || '14kg', price_per_cylinder, base_price || 0, subsidy_amount || 0, effective_from || new Date(), supplier || '']
    );
    res.status(201).json({ success: true, message: 'Tariff created', id: result.insertId });
  } catch (error) {
    console.error('Create gas tariff error:', error);
    res.status(500).json({ error: 'Failed to create tariff' });
  }
});

// =====================================================
// SETTINGS
// =====================================================

router.get('/settings', verifyGasAdminToken, async (req, res) => {
  try {
    const [rows] = await promisePool.query("SELECT setting_key, setting_value FROM settings WHERE category = 'gas' OR category = 'general'");
    res.json({ settings: rows });
  } catch (error) {
    console.error('Get gas settings error:', error);
    res.json({ settings: [] });
  }
});

router.put('/settings', verifyGasAdminToken, async (req, res) => {
  try {
    const { settings } = req.body;
    for (const [key, value] of Object.entries(settings)) {
      const strVal = typeof value === 'object' ? JSON.stringify(value) : String(value);
      const settingType = typeof value === 'boolean' ? 'boolean' : typeof value === 'number' ? 'number' : 'string';
      await promisePool.query(
        "INSERT INTO settings (setting_key, setting_value, setting_type, category) VALUES (?, ?, ?, 'gas') ON DUPLICATE KEY UPDATE setting_value = ?, updated_at = NOW()",
        [key, strVal, settingType, strVal]
      );
    }
    res.json({ success: true, message: 'Settings saved' });
  } catch (error) {
    console.error('Save gas settings error:', error);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

module.exports = router;
