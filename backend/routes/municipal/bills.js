const express = require('express');
const router = express.Router();
const { promisePool } = require('../../config/database');

// =====================================================
// MUNICIPAL BILLS ROUTES
// =====================================================

// Fetch property tax bill by property ID
router.get('/property-tax/:propertyId', async (req, res) => {
  try {
    const { propertyId } = req.params;

    const [rows] = await promisePool.query(
      `SELECT * FROM municipal_property_tax WHERE property_id = ? ORDER BY due_date DESC LIMIT 1`,
      [propertyId]
    );

    if (rows.length === 0) {
      // Return mock bill for demo
      const year = new Date().getFullYear();
      return res.json({
        success: true,
        data: {
          property_id: propertyId,
          owner_name: 'Property Owner',
          property_address: 'As per records',
          annual_value: 120000,
          tax_rate: 0.15,
          property_tax: 18000,
          house_tax: 3600,
          total_tax: 21600,
          arrears: 0,
          total_due: 21600,
          due_date: `${year}-03-31`,
          financial_year: `${year - 1}-${year}`,
          status: 'Unpaid',
        },
      });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Fetch property tax error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Fetch trade license fee
router.get('/trade-license/:licenseNumber', async (req, res) => {
  try {
    const { licenseNumber } = req.params;

    const [rows] = await promisePool.query(
      `SELECT * FROM municipal_trade_licenses WHERE license_number = ?`,
      [licenseNumber]
    );

    if (rows.length === 0) {
      return res.json({
        success: true,
        data: {
          license_number: licenseNumber,
          business_name: 'Business Name',
          proprietor_name: 'Proprietor',
          business_type: 'General Trade',
          renewal_fee: 2500,
          penalty: 0,
          total_due: 2500,
          validity_date: new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0],
          status: 'Active',
        },
      });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Fetch trade license error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Fetch SWM (Solid Waste Management) charges
router.get('/sw-charges/:consumerNumber', async (req, res) => {
  try {
    const { consumerNumber } = req.params;

    res.json({
      success: true,
      data: {
        consumer_number: consumerNumber,
        consumer_name: 'Consumer',
        property_type: 'Residential',
        monthly_rate: 200,
        arrears: 0,
        total_due: 200,
        due_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 10).toISOString().split('T')[0],
        status: 'Unpaid',
      },
    });
  } catch (error) {
    console.error('Fetch SW charges error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
