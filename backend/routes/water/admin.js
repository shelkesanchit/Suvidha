const express = require('express');
const router = express.Router();
const { promisePool } = require('../../config/database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'water_admin_secret_key_2024';

// Auth Middleware for Water Admin
const verifyWaterAdminToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.adminUser = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// =====================================================
// AUTH ROUTES
// =====================================================

// Admin Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    console.log('Water admin login attempt:', { username, password: '***' });
    
    const [users] = await promisePool.query(
      `SELECT * FROM admin_users WHERE username = ? AND status = 'active'`,
      [username]
    );
    
    console.log('Found users:', users.length);
    
    if (users.length === 0) {
      console.log('No user found with username:', username);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = users[0];
    console.log('User found:', { id: user.id, username: user.username, has_password_hash: !!user.password_hash });
    
    // For demo, accept 'admin123' as password
    const validPassword = password === 'admin123' || 
                          (user.password_hash && await bcrypt.compare(password, user.password_hash));
    
    console.log('Password validation result:', validPassword);
    
    if (!validPassword) {
      console.log('Password validation failed');
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Update last login
    await promisePool.query(
      'UPDATE admin_users SET last_login = NOW() WHERE id = ?',
      [user.id]
    );
    
    // Generate token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, name: user.full_name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        designation: user.designation
      }
    });
    
  } catch (error) {
    console.error('Water admin login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get Current User (auth/me)
router.get('/auth/me', verifyWaterAdminToken, async (req, res) => {
  try {
    const [users] = await promisePool.query(
      `SELECT id, username, full_name, role, email, designation, created_at 
       FROM admin_users 
       WHERE id = ? AND status = 'active'`,
      [req.adminUser.id]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(users[0]);
  } catch (error) {
    console.error('Water auth/me error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Verify Token
router.get('/verify', verifyWaterAdminToken, (req, res) => {
  res.json({ valid: true, user: req.adminUser });
});

// =====================================================
// DASHBOARD ROUTES
// =====================================================

router.get('/dashboard/stats', verifyWaterAdminToken, async (req, res) => {
  try {
    // Get total consumers
    const [consumersResult] = await promisePool.query(
      `SELECT COUNT(*) as total FROM water_customers WHERE connection_status = 'active'`
    );
    
    // Get pending applications
    const [pendingAppsResult] = await promisePool.query(
      `SELECT COUNT(*) as total FROM water_applications WHERE status IN ('submitted', 'document_verification', 'site_inspection', 'approval_pending')`
    );
    
    // Get open complaints
    const [openComplaintsResult] = await promisePool.query(
      `SELECT COUNT(*) as total FROM water_complaints WHERE status IN ('open', 'assigned', 'in_progress')`
    );
    
    // Get today's revenue
    const [todayRevenueResult] = await promisePool.query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM water_payments WHERE status = 'success' AND DATE(completed_at) = CURDATE()`
    );
    
    // Get month's revenue
    const [monthRevenueResult] = await promisePool.query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM water_payments WHERE status = 'success' AND MONTH(completed_at) = MONTH(CURDATE()) AND YEAR(completed_at) = YEAR(CURDATE())`
    );
    
    // Get today's applications
    const [todayAppsResult] = await promisePool.query(
      `SELECT COUNT(*) as total FROM water_applications WHERE DATE(submitted_at) = CURDATE()`
    );
    
    // Get today's complaints
    const [todayComplaintsResult] = await promisePool.query(
      `SELECT COUNT(*) as total FROM water_complaints WHERE DATE(created_at) = CURDATE()`
    );
    
    // Get applications trend (last 6 months)
    const [applicationsTrend] = await promisePool.query(
      `SELECT 
        DATE_FORMAT(MIN(submitted_at), '%b') as month,
        COUNT(*) as applications,
        SUM(CASE WHEN status = 'completed' OR status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
       FROM water_applications 
       WHERE submitted_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
       GROUP BY MONTH(submitted_at), YEAR(submitted_at)
       ORDER BY YEAR(MIN(submitted_at)), MONTH(MIN(submitted_at))`
    );
    
    // Get revenue trend (last 6 months)
    const [revenueTrend] = await promisePool.query(
      `SELECT 
        DATE_FORMAT(MIN(completed_at), '%b') as month,
        COALESCE(SUM(amount), 0) as revenue
       FROM water_payments 
       WHERE status = 'success' AND completed_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
       GROUP BY MONTH(completed_at), YEAR(completed_at)
       ORDER BY YEAR(MIN(completed_at)), MONTH(MIN(completed_at))`
    );
    
    // Get applications by type
    const [applicationsByType] = await promisePool.query(
      `SELECT application_type as name, COUNT(*) as value 
       FROM water_applications 
       GROUP BY application_type`
    );
    
    // Get complaints by status
    const [complaintsByStatus] = await promisePool.query(
      `SELECT status as name, COUNT(*) as value 
       FROM water_complaints 
       GROUP BY status`
    );
    
    // Get complaints by category
    const [complaintsByCategory] = await promisePool.query(
      `SELECT complaint_category as name, COUNT(*) as value 
       FROM water_complaints 
       GROUP BY complaint_category`
    );
    
    res.json({
      total_consumers: consumersResult[0]?.total || 0,
      active_connections: consumersResult[0]?.total || 0,
      pending_applications: pendingAppsResult[0]?.total || 0,
      open_complaints: openComplaintsResult[0]?.total || 0,
      today_revenue: todayRevenueResult[0]?.total || 0,
      month_revenue: monthRevenueResult[0]?.total || 0,
      today_applications: todayAppsResult[0]?.total || 0,
      today_complaints: todayComplaintsResult[0]?.total || 0,
      applicationsTrend: applicationsTrend.length > 0 ? applicationsTrend : [
        { month: 'Jan', applications: 0, approved: 0, rejected: 0 },
        { month: 'Feb', applications: 0, approved: 0, rejected: 0 }
      ],
      revenueTrend: revenueTrend.length > 0 ? revenueTrend : [
        { month: 'Jan', revenue: 0 },
        { month: 'Feb', revenue: 0 }
      ],
      applicationsByType: applicationsByType.length > 0 ? applicationsByType : [
        { name: 'New Connection', value: 0 }
      ],
      complaintsByStatus: complaintsByStatus.length > 0 ? complaintsByStatus : [
        { name: 'Open', value: 0 }
      ],
      complaintsByCategory: complaintsByCategory.length > 0 ? complaintsByCategory : [
        { name: 'No Water', value: 0 }
      ]
    });
    
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// =====================================================
// APPLICATIONS MANAGEMENT
// =====================================================

// Get all applications
router.get('/applications', verifyWaterAdminToken, async (req, res) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `SELECT * FROM water_applications WHERE 1=1`;
    const params = [];
    
    if (status) {
      query += ` AND status = ?`;
      params.push(status);
    }
    
    if (search) {
      query += ` AND (application_number LIKE ? OR full_name LIKE ? OR mobile LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    query += ` ORDER BY submitted_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));
    
    const [applications] = await promisePool.query(query, params);
    
    // Parse JSON fields safely (handle both string and already-parsed object)
    applications.forEach(app => {
      if (app.stage_history) {
        if (typeof app.stage_history === 'string') {
          try { app.stage_history = JSON.parse(app.stage_history); } catch (e) { app.stage_history = []; }
        } else if (typeof app.stage_history !== 'object') {
          app.stage_history = [];
        }
      } else {
        app.stage_history = [];
      }
      if (app.documents) {
        if (typeof app.documents === 'string') {
          try { app.documents = JSON.parse(app.documents); } catch (e) { app.documents = []; }
        } else if (typeof app.documents !== 'object') {
          app.documents = [];
        }
      } else {
        app.documents = [];
      }
    });
    
    // Get total count
    const [countResult] = await promisePool.query(
      `SELECT COUNT(*) as total FROM water_applications`
    );
    
    res.json({
      data: applications,
      total: countResult[0].total,
      page: parseInt(page),
      limit: parseInt(limit)
    });
    
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// Get single application
router.get('/applications/:id', verifyWaterAdminToken, async (req, res) => {
  try {
    const [applications] = await promisePool.query(
      `SELECT * FROM water_applications WHERE id = ?`,
      [req.params.id]
    );
    
    if (applications.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    const app = applications[0];
    // Handle JSON fields (may be string or already-parsed object)
    if (app.stage_history) {
      if (typeof app.stage_history === 'string') {
        try { app.stage_history = JSON.parse(app.stage_history); } catch (e) { app.stage_history = []; }
      }
    } else {
      app.stage_history = [];
    }
    if (app.documents) {
      if (typeof app.documents === 'string') {
        try { app.documents = JSON.parse(app.documents); } catch (e) { app.documents = []; }
      }
    } else {
      app.documents = [];
    }
    
    res.json(app);
    
  } catch (error) {
    console.error('Get application error:', error);
    res.status(500).json({ error: 'Failed to fetch application' });
  }
});

// Update application status
router.put('/applications/:id', verifyWaterAdminToken, async (req, res) => {
  const connection = await promisePool.getConnection();
  try {
    await connection.beginTransaction();
    
    const { status, current_stage, remarks, assigned_engineer, rejection_reason } = req.body;
    const { id } = req.params;
    
    // Get current application
    const [apps] = await connection.query(
      'SELECT * FROM water_applications WHERE id = ?', [id]
    );
    
    if (apps.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Application not found' });
    }
    
    const app = apps[0];
    let stageHistory = [];
    // Handle JSON field (may be string or already-parsed object)
    if (app.stage_history) {
      if (typeof app.stage_history === 'string') {
        try { stageHistory = JSON.parse(app.stage_history); } catch (e) { stageHistory = []; }
      } else if (Array.isArray(app.stage_history)) {
        stageHistory = app.stage_history;
      }
    }
    
    // Add new stage to history
    if (current_stage && current_stage !== app.current_stage) {
      stageHistory.push({
        stage: current_stage,
        status: status,
        timestamp: new Date().toISOString(),
        remarks: remarks || '',
        updated_by: req.adminUser.name
      });
    }
    
    // Update application
    await connection.query(
      `UPDATE water_applications 
       SET status = ?, current_stage = ?, stage_history = ?, remarks = ?,
           assigned_engineer = ?, rejection_reason = ?,
           processed_at = CASE WHEN ? IN ('approved', 'rejected', 'completed') THEN NOW() ELSE processed_at END,
           completed_at = CASE WHEN ? = 'completed' THEN NOW() ELSE completed_at END
       WHERE id = ?`,
      [
        status, current_stage, JSON.stringify(stageHistory), remarks,
        assigned_engineer || app.assigned_engineer, rejection_reason,
        status, status, id
      ]
    );
    
    // If completed/approved, create consumer record
    if (status === 'completed' && app.application_type === 'new_connection') {
      const consumerNumber = `WC${new Date().getFullYear()}${String(id).padStart(6, '0')}`;
      
      await connection.query(
        `INSERT INTO water_customers 
        (consumer_number, full_name, father_spouse_name, email, mobile, aadhaar_number,
         property_id, house_flat_no, building_name, ward, address, landmark,
         connection_type, property_type, ownership_status, pipe_size,
         connection_status, connection_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', CURDATE())`,
        [
          consumerNumber, app.full_name, app.father_spouse_name, app.email, app.mobile,
          app.aadhaar_number, app.property_id, app.house_flat_no, app.building_name,
          app.ward, app.address, app.landmark, app.connection_type_requested,
          app.property_type, app.ownership_status, app.pipe_size_requested
        ]
      );
    }
    
    await connection.commit();
    
    res.json({ success: true, message: 'Application updated successfully' });
    
  } catch (error) {
    await connection.rollback();
    console.error('Update application error:', error);
    res.status(500).json({ error: 'Failed to update application' });
  } finally {
    connection.release();
  }
});

// =====================================================
// COMPLAINTS MANAGEMENT
// =====================================================

// Get all complaints
router.get('/complaints', verifyWaterAdminToken, async (req, res) => {
  try {
    const { status, category, search, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `SELECT * FROM water_complaints WHERE 1=1`;
    const params = [];
    
    if (status) {
      query += ` AND status = ?`;
      params.push(status);
    }
    
    if (category) {
      query += ` AND complaint_category = ?`;
      params.push(category);
    }
    
    if (search) {
      query += ` AND (complaint_number LIKE ? OR contact_name LIKE ? OR mobile LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    query += ` ORDER BY 
      CASE WHEN status IN ('open', 'assigned') THEN 0 ELSE 1 END,
      priority ASC,
      created_at DESC 
      LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));
    
    const [complaints] = await promisePool.query(query, params);
    
    // Get total count
    const [countResult] = await promisePool.query(
      `SELECT COUNT(*) as total FROM water_complaints`
    );
    
    res.json({
      data: complaints,
      total: countResult[0].total,
      page: parseInt(page),
      limit: parseInt(limit)
    });
    
  } catch (error) {
    console.error('Get complaints error:', error);
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
});

// Update complaint
router.put('/complaints/:id', verifyWaterAdminToken, async (req, res) => {
  try {
    const { status, assigned_engineer, resolution_notes, priority } = req.body;
    const { id } = req.params;
    
    let updateFields = [];
    let params = [];
    
    if (status) {
      updateFields.push('status = ?');
      params.push(status);
      
      if (status === 'resolved') {
        updateFields.push('resolved_at = NOW()');
      } else if (status === 'closed') {
        updateFields.push('closed_at = NOW()');
      } else if (status === 'assigned') {
        updateFields.push('assignment_date = NOW()');
      }
    }
    
    if (assigned_engineer) {
      updateFields.push('assigned_engineer = ?');
      params.push(assigned_engineer);
    }
    
    if (resolution_notes) {
      updateFields.push('resolution_notes = ?');
      params.push(resolution_notes);
    }
    
    if (priority !== undefined) {
      updateFields.push('priority = ?');
      params.push(priority);
    }
    
    params.push(id);
    
    await promisePool.query(
      `UPDATE water_complaints SET ${updateFields.join(', ')} WHERE id = ?`,
      params
    );
    
    res.json({ success: true, message: 'Complaint updated successfully' });
    
  } catch (error) {
    console.error('Update complaint error:', error);
    res.status(500).json({ error: 'Failed to update complaint' });
  }
});

// =====================================================
// CONSUMERS MANAGEMENT
// =====================================================

// Get all consumers
router.get('/consumers', verifyWaterAdminToken, async (req, res) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `SELECT * FROM water_customers WHERE 1=1`;
    const params = [];
    
    if (status) {
      query += ` AND connection_status = ?`;
      params.push(status);
    }
    
    if (search) {
      query += ` AND (consumer_number LIKE ? OR full_name LIKE ? OR mobile LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));
    
    const [consumers] = await promisePool.query(query, params);
    
    // Get total count
    const [countResult] = await promisePool.query(
      `SELECT COUNT(*) as total FROM water_customers`
    );
    
    res.json({
      data: consumers,
      total: countResult[0].total,
      page: parseInt(page),
      limit: parseInt(limit)
    });
    
  } catch (error) {
    console.error('Get consumers error:', error);
    res.status(500).json({ error: 'Failed to fetch consumers' });
  }
});

// Update consumer
router.put('/consumers/:id', verifyWaterAdminToken, async (req, res) => {
  try {
    const { connection_status, meter_number, tariff_category } = req.body;
    const { id } = req.params;
    
    await promisePool.query(
      `UPDATE water_customers 
       SET connection_status = COALESCE(?, connection_status),
           meter_number = COALESCE(?, meter_number),
           tariff_category = COALESCE(?, tariff_category)
       WHERE id = ?`,
      [connection_status, meter_number, tariff_category, id]
    );
    
    res.json({ success: true, message: 'Consumer updated successfully' });
    
  } catch (error) {
    console.error('Update consumer error:', error);
    res.status(500).json({ error: 'Failed to update consumer' });
  }
});

// =====================================================
// REPORTS
// =====================================================

// Full Reports endpoint for Reports page
router.get('/reports', verifyWaterAdminToken, async (req, res) => {
  try {
    const { type, month } = req.query;
    
    // Parse month parameter (format: 2026-02)
    const selectedDate = month ? new Date(month + '-01') : new Date();
    const year = selectedDate.getFullYear();
    const monthNum = selectedDate.getMonth() + 1;
    
    // Calculate date range based on report type
    let startDate, endDate;
    if (type === 'yearly') {
      startDate = `${year}-01-01`;
      endDate = `${year}-12-31`;
    } else if (type === 'quarterly') {
      const quarter = Math.floor((monthNum - 1) / 3);
      const quarterStart = quarter * 3 + 1;
      startDate = `${year}-${String(quarterStart).padStart(2, '0')}-01`;
      const quarterEnd = quarterStart + 2;
      const lastDay = new Date(year, quarterEnd, 0).getDate();
      endDate = `${year}-${String(quarterEnd).padStart(2, '0')}-${lastDay}`;
    } else {
      // Monthly (default)
      startDate = `${year}-${String(monthNum).padStart(2, '0')}-01`;
      const lastDay = new Date(year, monthNum, 0).getDate();
      endDate = `${year}-${String(monthNum).padStart(2, '0')}-${lastDay}`;
    }

    // 1. Summary Statistics
    const [consumersTotal] = await promisePool.query(
      `SELECT COUNT(*) as total FROM water_customers`
    );
    const [consumersActive] = await promisePool.query(
      `SELECT COUNT(*) as total FROM water_customers WHERE connection_status = 'active'`
    );
    const [billsData] = await promisePool.query(
      `SELECT 
        COALESCE(SUM(total_amount), 0) as totalBilled,
        COALESCE(SUM(amount_paid), 0) as totalCollected
       FROM water_bills`
    );
    const [appsTotal] = await promisePool.query(
      `SELECT COUNT(*) as total FROM water_applications`
    );
    const [complaintsData] = await promisePool.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status IN ('resolved', 'closed') THEN 1 ELSE 0 END) as resolved
       FROM water_complaints`
    );

    const summary = {
      totalConsumers: consumersTotal[0]?.total || 0,
      activeConnections: consumersActive[0]?.total || 0,
      totalBilled: parseFloat(billsData[0]?.totalBilled) || 0,
      totalCollected: parseFloat(billsData[0]?.totalCollected) || 0,
      totalApplications: appsTotal[0]?.total || 0,
      totalComplaints: complaintsData[0]?.total || 0,
      resolvedComplaints: parseInt(complaintsData[0]?.resolved) || 0,
    };

    // 2. Collections data (last 6 months)
    const [collectionsData] = await promisePool.query(
      `SELECT 
        DATE_FORMAT(bill_date, '%b') as month,
        COALESCE(SUM(total_amount), 0) as billed,
        COALESCE(SUM(amount_paid), 0) as collected
       FROM water_bills
       WHERE bill_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
       GROUP BY YEAR(bill_date), MONTH(bill_date), DATE_FORMAT(bill_date, '%b')
       ORDER BY YEAR(bill_date), MONTH(bill_date)`
    );

    // 3. Category-wise distribution
    const [categoryData] = await promisePool.query(
      `SELECT 
        COALESCE(property_type, 'residential') as category,
        COUNT(*) as consumers,
        0 as revenue
       FROM water_customers
       GROUP BY property_type
       ORDER BY consumers DESC`
    );
    
    // Capitalize category names
    const categoryWise = categoryData.map(c => ({
      category: c.category.charAt(0).toUpperCase() + c.category.slice(1),
      consumers: c.consumers,
      revenue: c.revenue
    }));

    // Calculate revenue per category from bills
    const [categoryRevenue] = await promisePool.query(
      `SELECT 
        COALESCE(wc.property_type, 'residential') as category,
        COALESCE(SUM(wb.amount_paid), 0) as revenue
       FROM water_customers wc
       LEFT JOIN water_bills wb ON wc.consumer_number = wb.consumer_number
       GROUP BY wc.property_type`
    );
    
    // Merge revenue into categoryWise
    categoryRevenue.forEach(cr => {
      const cat = categoryWise.find(c => c.category.toLowerCase() === (cr.category || 'residential').toLowerCase());
      if (cat) {
        cat.revenue = parseFloat(cr.revenue) || 0;
      }
    });

    // 4. Ward-wise distribution
    const [wardData] = await promisePool.query(
      `SELECT 
        COALESCE(ward, 'Unknown') as ward,
        COUNT(*) as consumers,
        0 as revenue
       FROM water_customers
       WHERE ward IS NOT NULL AND ward != ''
       GROUP BY ward
       ORDER BY consumers DESC
       LIMIT 10`
    );
    
    const wardWise = wardData.map(w => ({
      ward: w.ward.startsWith('Ward') ? w.ward : `Ward ${w.ward}`,
      consumers: w.consumers,
      revenue: 0
    }));

    // 5. Applications by type
    const [appsData] = await promisePool.query(
      `SELECT 
        CASE application_type 
          WHEN 'new_connection' THEN 'New Connection'
          WHEN 'reconnection' THEN 'Reconnection'
          WHEN 'disconnection' THEN 'Disconnection'
          WHEN 'transfer' THEN 'Transfer'
          WHEN 'pipe_size_change' THEN 'Pipe Change'
          WHEN 'meter_change' THEN 'Meter Change'
          ELSE application_type 
        END as type,
        SUM(CASE WHEN status IN ('submitted', 'document_verification', 'site_inspection', 'approval_pending') THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status IN ('approved', 'completed') THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
       FROM water_applications
       GROUP BY application_type`
    );

    const applications = appsData.length > 0 ? appsData.map(a => ({
      type: a.type,
      pending: parseInt(a.pending) || 0,
      approved: parseInt(a.approved) || 0,
      rejected: parseInt(a.rejected) || 0
    })) : [
      { type: 'New Connection', pending: 0, approved: 0, rejected: 0 }
    ];

    // 6. Complaints by category
    const [complaintsCategory] = await promisePool.query(
      `SELECT 
        CASE complaint_category
          WHEN 'no-water' THEN 'No Water'
          WHEN 'low-pressure' THEN 'Low Pressure'
          WHEN 'pipeline-leak' THEN 'Pipeline Leak'
          WHEN 'contaminated' THEN 'Contaminated'
          WHEN 'meter-stopped' THEN 'Meter Stopped'
          WHEN 'high-bill' THEN 'High Bill'
          WHEN 'illegal-connection' THEN 'Illegal Connection'
          WHEN 'sewerage' THEN 'Sewerage'
          ELSE complaint_category
        END as category,
        SUM(CASE WHEN status IN ('open', 'assigned', 'in_progress', 'reopened') THEN 1 ELSE 0 END) as open,
        SUM(CASE WHEN status IN ('resolved', 'closed') THEN 1 ELSE 0 END) as resolved
       FROM water_complaints
       GROUP BY complaint_category`
    );

    const complaints = complaintsCategory.length > 0 ? complaintsCategory.map(c => ({
      category: c.category || 'Other',
      open: parseInt(c.open) || 0,
      resolved: parseInt(c.resolved) || 0
    })) : [
      { category: 'No Water', open: 0, resolved: 0 }
    ];

    // Construct collections array (ensure at least some data points)
    let collections = collectionsData.map(c => ({
      month: c.month,
      billed: parseFloat(c.billed) || 0,
      collected: parseFloat(c.collected) || 0
    }));

    // If no collections data, create empty months
    if (collections.length === 0) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      collections = months.map(m => ({ month: m, billed: 0, collected: 0 }));
    }

    res.json({
      success: true,
      data: {
        summary,
        collections,
        categoryWise: categoryWise.length > 0 ? categoryWise : [{ category: 'Residential', consumers: 0, revenue: 0 }],
        wardWise: wardWise.length > 0 ? wardWise : [{ ward: 'Ward 1', consumers: 0, revenue: 0 }],
        applications,
        complaints
      }
    });

  } catch (error) {
    console.error('Reports error:', error);
    res.status(500).json({ error: 'Failed to generate report', details: error.message });
  }
});

router.get('/reports/summary', verifyWaterAdminToken, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    // Applications summary
    const [appsSummary] = await promisePool.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN status IN ('submitted', 'document_verification', 'site_inspection', 'approval_pending') THEN 1 ELSE 0 END) as pending
       FROM water_applications
       WHERE DATE(submitted_at) BETWEEN ? AND ?`,
      [start_date || '2024-01-01', end_date || new Date().toISOString().split('T')[0]]
    );
    
    // Complaints summary
    const [complaintsSummary] = await promisePool.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status IN ('resolved', 'closed') THEN 1 ELSE 0 END) as resolved,
        SUM(CASE WHEN status IN ('open', 'assigned', 'in_progress') THEN 1 ELSE 0 END) as pending
       FROM water_complaints
       WHERE DATE(created_at) BETWEEN ? AND ?`,
      [start_date || '2024-01-01', end_date || new Date().toISOString().split('T')[0]]
    );
    
    // Revenue summary
    const [revenueSummary] = await promisePool.query(
      `SELECT 
        COUNT(*) as total_transactions,
        COALESCE(SUM(amount), 0) as total_revenue
       FROM water_payments
       WHERE status = 'success' AND DATE(completed_at) BETWEEN ? AND ?`,
      [start_date || '2024-01-01', end_date || new Date().toISOString().split('T')[0]]
    );
    
    res.json({
      applications: appsSummary[0],
      complaints: complaintsSummary[0],
      revenue: revenueSummary[0]
    });
    
  } catch (error) {
    console.error('Reports error:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// =====================================================
// TARIFF MANAGEMENT
// =====================================================

router.get('/tariffs', verifyWaterAdminToken, async (req, res) => {
  try {
    const [tariffs] = await promisePool.query(
      `SELECT * FROM water_tariffs WHERE is_active = TRUE ORDER BY category`
    );
    res.json(tariffs);
  } catch (error) {
    console.error('Get tariffs error:', error);
    res.status(500).json({ error: 'Failed to fetch tariffs' });
  }
});

router.put('/tariffs/:id', verifyWaterAdminToken, async (req, res) => {
  try {
    const { slab_1_rate, slab_2_rate, slab_3_rate, slab_4_rate, minimum_charge, meter_rent } = req.body;
    
    await promisePool.query(
      `UPDATE water_tariffs 
       SET slab_1_rate = ?, slab_2_rate = ?, slab_3_rate = ?, slab_4_rate = ?,
           minimum_charge = ?, meter_rent = ?
       WHERE id = ?`,
      [slab_1_rate, slab_2_rate, slab_3_rate, slab_4_rate, minimum_charge, meter_rent, req.params.id]
    );
    
    res.json({ success: true, message: 'Tariff updated successfully' });
  } catch (error) {
    console.error('Update tariff error:', error);
    res.status(500).json({ error: 'Failed to update tariff' });
  }
});

module.exports = router;
