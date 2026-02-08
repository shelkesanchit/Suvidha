const express = require('express');
const router = express.Router();
const { promisePool } = require('../../config/database');

// =====================================================
// WATER APPLICATIONS ROUTES
// =====================================================

// Submit new water application
router.post('/submit', async (req, res) => {
  const connection = await promisePool.getConnection();
  try {
    await connection.beginTransaction();
    
    const { application_type, application_data } = req.body;
    
    // Generate application number
    const year = new Date().getFullYear();
    const typePrefix = {
      'new_connection': 'WNC',
      'reconnection': 'WRC',
      'disconnection': 'WDC',
      'transfer': 'WTR',
      'pipe_size_change': 'WPS',
      'meter_change': 'WMC'
    }[application_type] || 'WAPP';
    
    const [countResult] = await connection.query(
      'SELECT COUNT(*) as count FROM water_applications WHERE YEAR(submitted_at) = ?',
      [year]
    );
    const applicationNumber = `${typePrefix}${year}${String(countResult[0].count + 1).padStart(6, '0')}`;
    
    // Calculate fees based on pipe size
    const pipeSizeFees = {
      '15mm': { connection_fee: 2000, security_deposit: 2000 },
      '20mm': { connection_fee: 3000, security_deposit: 3000 },
      '25mm': { connection_fee: 5000, security_deposit: 5000 },
      '40mm': { connection_fee: 10000, security_deposit: 10000 },
      '50mm': { connection_fee: 15000, security_deposit: 15000 }
    };
    const fees = pipeSizeFees[application_data.pipe_size] || pipeSizeFees['15mm'];
    const application_fee = 500;
    const total_fee = application_fee + fees.connection_fee + fees.security_deposit;
    
    // Initialize stage history
    const stageHistory = [{
      stage: 'Application Submitted',
      status: 'submitted',
      timestamp: new Date().toISOString(),
      remarks: 'Application submitted successfully'
    }];
    
    // Insert application
    const [result] = await connection.query(
      `INSERT INTO water_applications 
      (application_number, application_type, applicant_category, full_name, father_spouse_name, 
       aadhaar_number, mobile, email, property_id, house_flat_no, building_name, ward, 
       address, landmark, property_type, ownership_status, connection_purpose, 
       pipe_size_requested, connection_type_requested, status, current_stage, stage_history,
       documents, application_fee, connection_fee, security_deposit, total_fee) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        applicationNumber,
        application_type || 'new_connection',
        application_data.applicant_category || 'individual',
        application_data.full_name,
        application_data.father_spouse_name || null,
        application_data.aadhaar_number || null,
        application_data.mobile,
        application_data.email || null,
        application_data.property_id || null,
        application_data.house_flat_no || null,
        application_data.building_name || null,
        application_data.ward || null,
        application_data.address || `${application_data.house_flat_no}, ${application_data.building_name}, Ward ${application_data.ward}`,
        application_data.landmark || null,
        application_data.property_type || 'residential',
        application_data.ownership_status || 'owner',
        application_data.connection_purpose || 'drinking',
        application_data.pipe_size || '15mm',
        application_data.connection_type || 'permanent',
        'submitted',
        'Application Submitted',
        JSON.stringify(stageHistory),
        JSON.stringify(application_data.documents || []),
        application_fee,
        fees.connection_fee,
        fees.security_deposit,
        total_fee
      ]
    );
    
    await connection.commit();
    
    res.status(201).json({
      success: true,
      message: 'Water connection application submitted successfully',
      data: {
        application_number: applicationNumber,
        application_id: result.insertId,
        fees: {
          application_fee,
          connection_fee: fees.connection_fee,
          security_deposit: fees.security_deposit,
          total_fee
        }
      }
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Submit water application error:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
});

// Track application status
router.get('/track/:applicationNumber', async (req, res) => {
  try {
    const { applicationNumber } = req.params;
    
    const [applications] = await promisePool.query(
      `SELECT application_number, application_type, full_name, mobile, email, ward,
              property_type, house_flat_no, address, landmark, status, 
              current_stage, stage_history, submitted_at, processed_at, completed_at,
              pipe_size_requested, connection_type_requested, total_fee, fee_paid,
              assigned_engineer, remarks, rejection_reason
       FROM water_applications 
       WHERE application_number = ?`,
      [applicationNumber]
    );
    
    if (applications.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    
    const app = applications[0];
    // Handle JSON field (may be string or already-parsed object)
    if (app.stage_history) {
      if (typeof app.stage_history === 'string') {
        try { app.stage_history = JSON.parse(app.stage_history); } catch (e) { app.stage_history = []; }
      }
    } else {
      app.stage_history = [];
    }
    
    res.json({ success: true, data: app });
    
  } catch (error) {
    console.error('Track application error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get user's applications by mobile
router.get('/my-applications/:mobile', async (req, res) => {
  try {
    const { mobile } = req.params;
    
    const [applications] = await promisePool.query(
      `SELECT id, application_number, application_type, status, current_stage, 
              submitted_at, total_fee, fee_paid
       FROM water_applications 
       WHERE mobile = ?
       ORDER BY submitted_at DESC`,
      [mobile]
    );
    
    res.json({ success: true, data: applications });
    
  } catch (error) {
    console.error('Get my applications error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
