const express = require('express');
const router = express.Router();
const { promisePool } = require('../../config/database');

// =====================================================
// GAS BILLS ROUTES
// =====================================================

// Fetch bill by consumer number
router.get('/fetch/:consumerNumber', async (req, res) => {
  try {
    const { consumerNumber } = req.params;
    
    // Get consumer details
    const [consumers] = await promisePool.query(
      `SELECT * FROM gas_consumers WHERE consumer_number = ?`,
      [consumerNumber]
    );
    
    if (consumers.length === 0) {
      return res.status(404).json({ success: false, message: 'Consumer not found' });
    }
    
    const consumer = consumers[0];
    
    // Get latest unpaid bill
    const [bills] = await promisePool.query(
      `SELECT * FROM gas_bills 
       WHERE consumer_number = ? AND payment_status != 'paid'
       ORDER BY bill_date DESC
       LIMIT 1`,
      [consumerNumber]
    );
    
    let billData;
    if (bills.length > 0) {
      billData = bills[0];
    } else {
      // Generate mock bill data for demo (PNG consumers)
      const currentDate = new Date();
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 15);
      
      // Calculate charges based on consumption (PNG)
      const consumption = parseFloat((Math.random() * 15 + 5).toFixed(2)); // 5-20 SCM
      const gasCharges = parseFloat(consumption * 45); // Rs 45 per SCM
      const pipelineRent = 50;
      const serviceTax = parseFloat((gasCharges + pipelineRent) * 0.05);
      const vat = parseFloat(gasCharges * 0.05);
      const arrears = parseFloat(consumer.outstanding_amount) || 0;
      const totalAmount = parseFloat(gasCharges + pipelineRent + serviceTax + vat + arrears);
      
      billData = {
        bill_number: `GB${currentDate.getFullYear()}${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`,
        consumer_number: consumerNumber,
        consumer_name: consumer.full_name,
        address: consumer.address,
        property_id: consumer.property_id,
        connection_type: `${consumer.gas_type} / ${consumer.property_type}`,
        meter_no: consumer.meter_number,
        bill_month: currentDate.toLocaleString('default', { month: 'long', year: 'numeric' }),
        bill_date: currentDate.toISOString().split('T')[0],
        due_date: dueDate.toISOString().split('T')[0],
        previous_reading: parseFloat(consumer.last_meter_reading) || 0,
        current_reading: parseFloat(consumer.last_meter_reading || 0) + consumption,
        consumption_scm: consumption,
        gas_charges: parseFloat(gasCharges.toFixed(2)),
        pipeline_rent: pipelineRent,
        service_tax: parseFloat(serviceTax.toFixed(2)),
        vat: parseFloat(vat.toFixed(2)),
        arrears: arrears,
        late_fee: 0,
        total_amount: parseFloat(totalAmount.toFixed(2)),
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
          gas_type: consumer.gas_type,
          connection_type: consumer.property_type,
          meter_number: consumer.meter_number
        },
        bill: billData
      }
    });
    
  } catch (error) {
    console.error('Fetch gas bill error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get bill history
router.get('/history/:consumerNumber', async (req, res) => {
  try {
    const { consumerNumber } = req.params;
    
    const [bills] = await promisePool.query(
      `SELECT bill_number, bill_month, bill_year, bill_date, due_date, 
              consumption_scm, total_amount, payment_status, paid_at
       FROM gas_bills 
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

// Calculate bill (for self-meter reading)
router.post('/calculate', async (req, res) => {
  try {
    const { consumer_number, current_reading } = req.body;
    
    // Get consumer
    const [consumers] = await promisePool.query(
      'SELECT * FROM gas_consumers WHERE consumer_number = ?',
      [consumer_number]
    );
    
    if (consumers.length === 0) {
      return res.status(404).json({ success: false, message: 'Consumer not found' });
    }
    
    const consumer = consumers[0];
    const previousReading = consumer.last_meter_reading || 0;
    const consumption = current_reading - previousReading;
    
    if (consumption < 0) {
      return res.status(400).json({ success: false, message: 'Current reading cannot be less than previous reading' });
    }
    
    // Calculate charges based on tariff type
    let gasCharges;
    if (consumer.property_type === 'domestic') {
      // Slab-based for domestic
      if (consumption <= 10) {
        gasCharges = consumption * 40;
      } else if (consumption <= 25) {
        gasCharges = 10 * 40 + (consumption - 10) * 45;
      } else {
        gasCharges = 10 * 40 + 15 * 45 + (consumption - 25) * 50;
      }
    } else if (consumer.property_type === 'commercial') {
      gasCharges = consumption * 55;
    } else {
      gasCharges = consumption * 48;
    }
    
    const pipelineRent = consumer.gas_type === 'png' ? 50 : 0;
    const serviceTax = parseFloat((gasCharges + pipelineRent) * 0.05);
    const vat = parseFloat(gasCharges * 0.05);
    const arrears = parseFloat(consumer.outstanding_amount) || 0;
    const totalAmount = parseFloat(gasCharges + pipelineRent + serviceTax + vat + arrears);
    
    res.json({
      success: true,
      data: {
        consumer_number: consumer_number,
        previous_reading: previousReading,
        current_reading: current_reading,
        consumption_scm: consumption,
        gas_charges: parseFloat(gasCharges.toFixed(2)),
        pipeline_rent: pipelineRent,
        service_tax: parseFloat(serviceTax.toFixed(2)),
        vat: parseFloat(vat.toFixed(2)),
        arrears: arrears,
        total_amount: parseFloat(totalAmount.toFixed(2))
      }
    });
    
  } catch (error) {
    console.error('Calculate bill error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
