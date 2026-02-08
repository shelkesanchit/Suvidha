const express = require('express');
const router = express.Router();
const { promisePool } = require('../config/database');
const { verifyToken } = require('../middleware/auth');

// Get electricity bills by customer ID (public endpoint - no auth required)
router.get('/electricity/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;

    // Get customer from electricity_customers table
    const [customers] = await promisePool.query(
      `SELECT id, consumer_id, full_name, email, mobile, address, city, state, pincode
       FROM electricity_customers
       WHERE id = ? OR consumer_id = ?`,
      [customerId, customerId]
    );

    if (customers.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: `No customer found with ID: ${customerId}. Please check and try again.`,
        data: { bills: [] }
      });
    }

    const customer = customers[0];

    // Get bills for this customer (only actual bills created by admin)
    const [bills] = await promisePool.query(
      `SELECT id, bill_number, meter_number, bill_month, bill_year,
              billing_period_start, billing_period_end, units_consumed,
              consumption_charges, fixed_charges, tax_amount, total_amount,
              bill_status, issue_date, due_date, paid_date, paid_amount
       FROM electricity_bills
       WHERE customer_id = ?
       ORDER BY bill_year DESC, bill_month DESC`,
      [customer.id]
    );

    if (bills.length === 0) {
      return res.json({
        success: true,
        data: {
          consumer_number: customer.consumer_id,
          consumer_name: customer.full_name,
          email: customer.email,
          mobile: customer.mobile,
          address: customer.address,
          city: customer.city,
          state: customer.state,
          pincode: customer.pincode,
          bills: [],
          message: 'No bills created yet. Admin will create bills after meter installation and reading.'
        }
      });
    }

    // Format response
    const formattedBills = bills.map(bill => ({
      bill_number: bill.bill_number || `ELE-${bill.bill_year}-${bill.bill_month}`,
      billing_period: `${bill.bill_month}/${bill.bill_year}`,
      billing_date: bill.issue_date,
      due_date: bill.due_date,
      consumption_units: parseFloat(bill.units_consumed) || 0,
      energy_charges: parseFloat(bill.consumption_charges) || 0,
      fixed_charges: parseFloat(bill.fixed_charges) || 0,
      taxes: parseFloat(bill.tax_amount) || 0,
      total_amount: parseFloat(bill.total_amount) || 0,
      status: bill.bill_status === 'paid' ? 'Paid' : 'Unpaid',
      paid_date: bill.paid_date,
      paid_amount: parseFloat(bill.paid_amount) || 0
    }));

    res.json({
      success: true,
      data: {
        consumer_number: customer.consumer_id,
        consumer_name: customer.full_name,
        email: customer.email,
        mobile: customer.mobile,
        address: customer.address,
        city: customer.city,
        state: customer.state,
        pincode: customer.pincode,
        bills: formattedBills
      }
    });
  } catch (error) {
    console.error('Get electricity bills error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch bills',
      data: { bills: [] }
    });
  }
});

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
