const express = require('express');
const router = express.Router();
const { promisePool } = require('../../config/database');

// =====================================================
// WATER BILLS ROUTES
// =====================================================

// Fetch bill by consumer number
router.get('/fetch/:consumerNumber', async (req, res) => {
  try {
    const { consumerNumber } = req.params;
    
    // Get consumer details
    const [consumers] = await promisePool.query(
      `SELECT * FROM water_customers WHERE consumer_number = ?`,
      [consumerNumber]
    );
    
    if (consumers.length === 0) {
      return res.status(404).json({ success: false, message: 'Consumer not found' });
    }
    
    const consumer = consumers[0];
    
    // Get latest unpaid bill
    const [bills] = await promisePool.query(
      `SELECT * FROM water_bills 
       WHERE consumer_number = ? AND payment_status != 'paid'
       ORDER BY bill_date DESC
       LIMIT 1`,
      [consumerNumber]
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
      const waterCharges = consumption * 10; // Rs 10 per KL for demo
      const sewerageCharges = waterCharges * 0.2;
      const serviceTax = (waterCharges + sewerageCharges) * 0.06;
      
      billData = {
        bill_number: `WB${currentDate.getFullYear()}${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`,
        consumer_number: consumerNumber,
        consumer_name: consumer.full_name,
        address: consumer.address,
        property_id: consumer.property_id,
        connection_type: `${consumer.property_type} / ${consumer.meter_number ? 'Metered' : 'Unmetered'}`,
        meter_no: consumer.meter_number,
        bill_month: currentDate.toLocaleString('default', { month: 'long', year: 'numeric' }),
        bill_date: currentDate.toISOString().split('T')[0],
        due_date: dueDate.toISOString().split('T')[0],
        previous_reading: consumer.last_meter_reading || 0,
        current_reading: (consumer.last_meter_reading || 0) + consumption,
        consumption_kl: consumption,
        water_charges: waterCharges,
        sewerage_charges: sewerageCharges,
        service_tax: serviceTax,
        meter_rent: 10,
        arrears: consumer.outstanding_amount || 0,
        late_fee: 0,
        total_amount: waterCharges + sewerageCharges + serviceTax + 10 + (consumer.outstanding_amount || 0),
        status: 'Unpaid'
      };
    }
    
    res.json({ 
      success: true, 
      data: {
        consumer: {
          consumer_number: consumer.consumer_number,
          full_name: consumer.full_name,
          father_spouse_name: consumer.father_spouse_name,
          address: consumer.address,
          property_id: consumer.property_id,
          connection_type: consumer.property_type,
          meter_number: consumer.meter_number
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
router.get('/history/:consumerNumber', async (req, res) => {
  try {
    const { consumerNumber } = req.params;
    
    const [bills] = await promisePool.query(
      `SELECT bill_number, bill_month, bill_year, bill_date, due_date, 
              consumption_kl, total_amount, payment_status, paid_at
       FROM water_bills 
       WHERE consumer_number = ?
       ORDER BY bill_date DESC
       LIMIT 12`,
      [consumerNumber]
    );
    
    res.json({ success: true, data: bills });
    
  } catch (error) {
    console.error('Get bill history error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
