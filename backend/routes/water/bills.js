const express = require('express');
const router = express.Router();
const { promisePool } = require('../../config/database');

// =====================================================
// WATER BILLS ROUTES
// =====================================================

// Fetch bill by consumer ID
router.get('/fetch/:consumerId', async (req, res) => {
  try {
    const { consumerId } = req.params;
    
    // Get customer details from water_customers
    const [customers] = await promisePool.query(
      `SELECT * FROM water_customers WHERE consumer_id = ?`,
      [consumerId]
    );
    
    if (customers.length === 0) {
      return res.status(404).json({ success: false, message: 'Consumer not found' });
    }
    
    const customer = customers[0];
    
    // Get latest unpaid bill using actual water_bills columns
    const [bills] = await promisePool.query(
      `SELECT * FROM water_bills 
       WHERE customer_id = ? AND bill_status != 'paid'
       ORDER BY issue_date DESC
       LIMIT 1`,
      [customer.id]
    );
    
    let billData;
    if (bills.length > 0) {
      billData = bills[0];
    } else {
      // Generate mock bill data for demo
      const currentDate = new Date();
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 15);
      
      // Calculate charges based on consumption
      const consumption = Math.floor(Math.random() * 20) + 5; // 5-25 KL
      const consumptionCharges = consumption * 10; // Rs 10 per KL for demo
      const fixedCharges = 50;
      const taxAmount = (consumptionCharges + fixedCharges) * 0.06;
      
      billData = {
        bill_number: `WB${currentDate.getFullYear()}${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`,
        customer_id: customer.id,
        meter_number: customer.meter_number,
        billing_period_start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0],
        billing_period_end: currentDate.toISOString().split('T')[0],
        bill_month: currentDate.getMonth() + 1,
        bill_year: currentDate.getFullYear(),
        water_consumed: consumption,
        consumption_charges: consumptionCharges,
        fixed_charges: fixedCharges,
        tax_amount: taxAmount,
        previous_due: 0,
        total_amount: consumptionCharges + fixedCharges + taxAmount,
        bill_status: 'pending',
        issue_date: currentDate.toISOString().split('T')[0],
        due_date: dueDate.toISOString().split('T')[0],
        paid_date: null,
        paid_amount: null
      };
    }
    
    res.json({ 
      success: true, 
      data: {
        consumer: {
          consumer_id: customer.consumer_id,
          full_name: customer.full_name,
          address: customer.address,
          meter_number: customer.meter_number,
          meter_type: customer.meter_type,
          email: customer.email,
          mobile: customer.mobile
        },
        bill: billData
      }
    });
    
  } catch (error) {
    console.error('Fetch water bill error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get bill history
router.get('/history/:consumerId', async (req, res) => {
  try {
    const { consumerId } = req.params;
    
    // Look up customer internal id
    const [customers] = await promisePool.query(
      'SELECT id FROM water_customers WHERE consumer_id = ?',
      [consumerId]
    );
    
    if (customers.length === 0) {
      return res.status(404).json({ success: false, message: 'Consumer not found' });
    }
    
    const [bills] = await promisePool.query(
      `SELECT bill_number, bill_month, bill_year, issue_date, due_date, 
              water_consumed, total_amount, bill_status, paid_date
       FROM water_bills 
       WHERE customer_id = ?
       ORDER BY issue_date DESC
       LIMIT 12`,
      [customers[0].id]
    );
    
    res.json({ success: true, data: bills });
    
  } catch (error) {
    console.error('Get bill history error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
