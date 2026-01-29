const express = require('express');
const router = express.Router();
const { promisePool } = require('../config/database');
const { verifyToken } = require('../middleware/auth');

// Get all bills for a consumer
router.get('/consumer/:consumerNumber', verifyToken, async (req, res) => {
  try {
    // Get consumer account
    const [accounts] = await promisePool.query(
      'SELECT id FROM consumer_accounts WHERE consumer_number = ? AND user_id = ?',
      [req.params.consumerNumber, req.user.id]
    );

    if (accounts.length === 0) {
      return res.status(404).json({ error: 'Consumer account not found' });
    }

    const [bills] = await promisePool.query(
      `SELECT * FROM bills 
       WHERE consumer_account_id = ? 
       ORDER BY billing_month DESC`,
      [accounts[0].id]
    );

    res.json(bills);
  } catch (error) {
    console.error('Get bills error:', error);
    res.status(500).json({ error: 'Failed to fetch bills' });
  }
});

// Get specific bill
router.get('/:billNumber', verifyToken, async (req, res) => {
  try {
    const [bills] = await promisePool.query(
      `SELECT b.*, ca.consumer_number, ca.address_line1, ca.city, ca.state, ca.pincode
       FROM bills b
       JOIN consumer_accounts ca ON b.consumer_account_id = ca.id
       WHERE b.bill_number = ? AND ca.user_id = ?`,
      [req.params.billNumber, req.user.id]
    );

    if (bills.length === 0) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    res.json(bills[0]);
  } catch (error) {
    console.error('Get bill error:', error);
    res.status(500).json({ error: 'Failed to fetch bill' });
  }
});

// Calculate bill (utility function)
router.post('/calculate', verifyToken, async (req, res) => {
  try {
    const { category, units, sanctioned_load } = req.body;

    // Get tariff rates from settings
    const [settings] = await promisePool.query(
      `SELECT setting_key, setting_value FROM system_settings 
       WHERE setting_key LIKE 'tariff_%' OR setting_key LIKE 'fixed_charge_%' OR setting_key = 'tax_rate'`
    );

    const settingsMap = {};
    settings.forEach(s => {
      settingsMap[s.setting_key] = parseFloat(s.setting_value);
    });

    let energyCharges = 0;
    let fixedCharges = 0;

    // Calculate based on category
    if (category === 'residential') {
      if (units <= 100) {
        energyCharges = units * settingsMap.tariff_residential_upto_100;
      } else if (units <= 300) {
        energyCharges = (100 * settingsMap.tariff_residential_upto_100) + 
                       ((units - 100) * settingsMap.tariff_residential_101_300);
      } else {
        energyCharges = (100 * settingsMap.tariff_residential_upto_100) + 
                       (200 * settingsMap.tariff_residential_101_300) + 
                       ((units - 300) * settingsMap.tariff_residential_above_300);
      }
      fixedCharges = settingsMap.fixed_charge_residential || 50;
    } else if (category === 'commercial') {
      energyCharges = units * settingsMap.tariff_commercial;
      fixedCharges = settingsMap.fixed_charge_commercial || 200;
    } else if (category === 'industrial') {
      energyCharges = units * settingsMap.tariff_industrial;
      fixedCharges = sanctioned_load * 100;
    } else if (category === 'agricultural') {
      energyCharges = units * settingsMap.tariff_agricultural;
      fixedCharges = sanctioned_load * 50;
    }

    const subtotal = energyCharges + fixedCharges;
    const taxAmount = subtotal * (settingsMap.tax_rate / 100);
    const totalAmount = subtotal + taxAmount;

    res.json({
      units,
      category,
      energy_charges: parseFloat(energyCharges.toFixed(2)),
      fixed_charges: parseFloat(fixedCharges.toFixed(2)),
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax_amount: parseFloat(taxAmount.toFixed(2)),
      total_amount: parseFloat(totalAmount.toFixed(2))
    });
  } catch (error) {
    console.error('Calculate bill error:', error);
    res.status(500).json({ error: 'Failed to calculate bill' });
  }
});

// Get unpaid bills
router.get('/consumer/:consumerNumber/unpaid', verifyToken, async (req, res) => {
  try {
    const [accounts] = await promisePool.query(
      'SELECT id FROM consumer_accounts WHERE consumer_number = ? AND user_id = ?',
      [req.params.consumerNumber, req.user.id]
    );

    if (accounts.length === 0) {
      return res.status(404).json({ error: 'Consumer account not found' });
    }

    const [bills] = await promisePool.query(
      `SELECT * FROM bills 
       WHERE consumer_account_id = ? AND status IN ('unpaid', 'overdue', 'partial')
       ORDER BY billing_month ASC`,
      [accounts[0].id]
    );

    res.json(bills);
  } catch (error) {
    console.error('Get unpaid bills error:', error);
    res.status(500).json({ error: 'Failed to fetch unpaid bills' });
  }
});

module.exports = router;
