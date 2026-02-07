const express = require('express');
const router = express.Router();
const { promisePool } = require('../../config/database');

// =====================================================
// GAS APPLICATIONS ROUTES
// =====================================================

// Submit new gas application
router.post('/submit', async (req, res) => {
  const connection = await promisePool.getConnection();
  try {
    await connection.beginTransaction();
    
    const { application_type, application_data } = req.body;
    
    // Generate application number
    const year = new Date().getFullYear();
    const typePrefix = {
      'new_connection': 'GNC',
      'reconnection': 'GRC',
      'disconnection': 'GDC',
      'transfer': 'GTR',
      'cylinder_booking': 'GCB',
      'conversion': 'GCV'
    }[application_type] || 'GAPP';
    
    const [countResult] = await connection.query(
      'SELECT COUNT(*) as count FROM gas_applications WHERE YEAR(submitted_at) = ?',
      [year]
    );
    const applicationNumber = `${typePrefix}${year}${String(countResult[0].count + 1).padStart(6, '0')}`;
    
    // Calculate fees based on connection type
    const connectionFees = {
      'png_domestic': { connection_fee: 5000, security_deposit: 3000 },
      'png_commercial': { connection_fee: 10000, security_deposit: 5000 },
      'png_industrial': { connection_fee: 25000, security_deposit: 10000 },
      'lpg_domestic': { connection_fee: 1500, security_deposit: 2000 },
      'lpg_commercial': { connection_fee: 3500, security_deposit: 3500 }
    };
    const connectionType = `${application_data.gas_type || 'png'}_${application_data.property_type || 'domestic'}`;
    const fees = connectionFees[connectionType] || connectionFees['png_domestic'];
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
      `INSERT INTO gas_applications 
      (application_number, application_type, applicant_category, gas_type, full_name, father_spouse_name, 
       aadhaar_number, mobile, email, property_id, house_flat_no, building_name, ward, 
       address, landmark, property_type, ownership_status, connection_purpose, 
       pipeline_distance, cylinder_type, status, current_stage, stage_history,
       documents, application_fee, connection_fee, security_deposit, total_fee) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        applicationNumber,
        application_type || 'new_connection',
        application_data.applicant_category || 'individual',
        application_data.gas_type || 'png',
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
        application_data.property_type || 'domestic',
        application_data.ownership_status || 'owner',
        application_data.connection_purpose || 'cooking',
        application_data.pipeline_distance || null,
        application_data.cylinder_type || null,
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
      message: 'Gas connection application submitted successfully',
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
    console.error('Submit gas application error:', error);
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
      `SELECT application_number, application_type, gas_type, full_name, mobile, email, ward,
              property_type, house_flat_no, address, landmark, status, 
              current_stage, stage_history, submitted_at, processed_at, completed_at,
              cylinder_type, pipeline_distance, total_fee, fee_paid,
              assigned_engineer, remarks, rejection_reason
       FROM gas_applications 
       WHERE application_number = ?`,
      [applicationNumber]
    );
    
    if (applications.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    
    const app = applications[0];
    // Handle JSON field
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
      `SELECT id, application_number, application_type, gas_type, status, current_stage, 
              submitted_at, total_fee, fee_paid
       FROM gas_applications 
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

// Book LPG cylinder
router.post('/cylinder-booking', async (req, res) => {
  const connection = await promisePool.getConnection();
  try {
    await connection.beginTransaction();
    
    const { consumer_number, cylinder_type, quantity, delivery_preference } = req.body;
    
    // Verify consumer
    const [consumers] = await connection.query(
      'SELECT * FROM gas_consumers WHERE consumer_number = ?',
      [consumer_number]
    );
    
    if (consumers.length === 0) {
      return res.status(404).json({ success: false, message: 'Consumer not found' });
    }
    
    const consumer = consumers[0];
    
    // Generate booking number
    const year = new Date().getFullYear();
    const [countResult] = await connection.query(
      'SELECT COUNT(*) as count FROM gas_cylinder_bookings WHERE YEAR(booked_at) = ?',
      [year]
    );
    const bookingNumber = `GCB${year}${String(countResult[0].count + 1).padStart(6, '0')}`;
    
    // Calculate price
    const cylinderPrices = {
      'domestic_14.2kg': 850,
      'domestic_5kg': 450,
      'commercial_19kg': 2100,
      'commercial_47.5kg': 5200
    };
    const pricePerUnit = cylinderPrices[cylinder_type] || 850;
    const totalAmount = pricePerUnit * quantity;
    
    // Insert booking
    const [result] = await connection.query(
      `INSERT INTO gas_cylinder_bookings 
      (booking_number, consumer_id, consumer_number, cylinder_type, quantity, 
       unit_price, total_amount, delivery_preference, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        bookingNumber,
        consumer.id,
        consumer_number,
        cylinder_type,
        quantity,
        pricePerUnit,
        totalAmount,
        delivery_preference || 'home_delivery',
        'booked'
      ]
    );
    
    await connection.commit();
    
    res.status(201).json({
      success: true,
      message: 'Cylinder booked successfully',
      data: {
        booking_number: bookingNumber,
        booking_id: result.insertId,
        estimated_delivery: '2-3 business days',
        amount: totalAmount
      }
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Cylinder booking error:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
});

module.exports = router;
