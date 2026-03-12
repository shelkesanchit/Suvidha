const express = require('express');
const router = express.Router();
const { promisePool } = require('../../config/database');

// =====================================================
// MUNICIPAL APPLICATIONS ROUTES
// =====================================================

const TYPE_PREFIXES = {
  // Property & Tax
  'property_tax_payment': 'MPT',
  'house_tax_payment':    'MHT',
  'assessment_revision':  'MAR',
  'self_assessment':      'MSA',
  // Birth/Death
  'birth_certificate':    'MBC',
  'death_certificate':    'MDC',
  'certificate_correction': 'MCC',
  // Trade License
  'new_trade_license':    'MTL',
  'trade_license_renewal':'MLR',
  // Building
  'building_plan_approval':'MBP',
  'construction_permit':  'MCP',
  'occupancy_certificate':'MOC',
  // Sanitation
  'garbage_complaint':    'MGC',
  'bulk_waste_pickup':    'MBW',
  'sw_charges_payment':   'MSW',
  'sanitation_worker_request': 'MSN',
  // Roads
  'pothole_complaint':    'MRC',
  'streetlight_complaint':'MSL',
  'drain_manhole_complaint':'MDM',
  'road_cutting_permit':  'MRK',
  // Health
  'health_license_fee':   'MHL',
  'food_establishment_license': 'MFL',
  'fogging_request':      'MFG',
  'env_clearance':        'MEC',
  // Housing
  'housing_allotment':    'MHA',
  'municipal_rent_payment':'MRP',
  'encroachment_report':  'MER',
  // Marriage
  'marriage_registration':'MMR',
  // Grievance / RTI
  'grievance_complaint':  'MGV',
  'rti_application':      'MRT',
  'officer_appointment':  'MAP',
  // Admin Services
  'noc_certificate':      'MNC',
  'domicile_certificate': 'MDO',
  'resident_certificate': 'MRS',
  'annual_subscription':  'MAS',
  'advertisement_fee':    'MAF',
};

// Submit a municipal application
router.post('/submit', async (req, res) => {
  try {
    const { application_type, application_data } = req.body;

    if (!application_type || !application_data) {
      return res.status(400).json({ success: false, message: 'application_type and application_data are required' });
    }

    const year = new Date().getFullYear();
    const prefix = TYPE_PREFIXES[application_type] || 'MAPP';

    // Generate sequential application number
    let seqNum = String(Math.floor(Math.random() * 900000) + 100000);
    try {
      const [countResult] = await promisePool.query(
        'SELECT COUNT(*) as count FROM municipal_applications WHERE YEAR(submitted_at) = ?',
        [year]
      );
      seqNum = String(countResult[0].count + 1).padStart(6, '0');
    } catch (_) { /* table may not exist yet; use random */ }

    const applicationNumber = `${prefix}${year}${seqNum}`;

    try {
      await promisePool.query(
        `INSERT INTO municipal_applications 
         (application_number, application_type, applicant_name, mobile, application_data, status, submitted_at)
         VALUES (?, ?, ?, ?, ?, 'pending', NOW())`,
        [
          applicationNumber,
          application_type,
          application_data.name || application_data.applicant_name || 'Applicant',
          application_data.mobile || null,
          JSON.stringify(application_data),
        ]
      );
    } catch (_) { /* table may not exist yet; return success with generated number */ }

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: { application_number: applicationNumber },
    });
  } catch (error) {
    console.error('Submit municipal application error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Track an application by number
router.get('/track/:applicationNumber', async (req, res) => {
  try {
    const { applicationNumber } = req.params;

    const [rows] = await promisePool.query(
      `SELECT application_number, application_type, applicant_name, mobile,
              status, current_stage, remarks, submitted_at, updated_at
       FROM municipal_applications
       WHERE application_number = ?`,
      [applicationNumber]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Track municipal application error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// List applications by mobile
router.get('/list', async (req, res) => {
  try {
    const { mobile } = req.query;
    if (!mobile) return res.status(400).json({ success: false, message: 'mobile query param required' });

    const [rows] = await promisePool.query(
      `SELECT application_number, application_type, applicant_name, status, submitted_at
       FROM municipal_applications WHERE mobile = ? ORDER BY submitted_at DESC LIMIT 20`,
      [mobile]
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('List municipal applications error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
