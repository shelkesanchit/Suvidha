const express = require('express');
const router = express.Router();
const { promisePool } = require('../../config/database');

// =====================================================
// WATER PAYMENTS ROUTES
// =====================================================

// Process payment
router.post('/process', async (req, res) => {
  const connection = await promisePool.getConnection();
  try {
    await connection.beginTransaction();
    
    const { consumer_number, bill_number, amount, payment_method, mobile } = req.body;
    
    // Generate transaction ID
    const transactionId = `WTR${Date.now()}`;
    const receiptNumber = `WRCP${new Date().getFullYear()}${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`;
    
    // Get consumer
    const [consumers] = await connection.query(
      'SELECT id FROM water_customers WHERE consumer_number = ?',
      [consumer_number]
    );
    
    const consumerId = consumers.length > 0 ? consumers[0].id : null;
    
    // Get bill if exists
    let billId = null;
    if (bill_number) {
      const [bills] = await connection.query(
        'SELECT id FROM water_bills WHERE bill_number = ?',
        [bill_number]
      );
      billId = bills.length > 0 ? bills[0].id : null;
    }
    
    // Insert payment record
    const [result] = await connection.query(
      `INSERT INTO water_payments 
      (transaction_id, consumer_id, consumer_number, bill_id, bill_number, amount,
       payment_method, status, receipt_number, receipt_generated, completed_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        transactionId,
        consumerId,
        consumer_number,
        billId,
        bill_number || null,
        amount,
        payment_method,
        'success',
        receiptNumber,
        true
      ]
    );
    
    // Update bill status if exists
    if (billId) {
      await connection.query(
        `UPDATE water_bills 
         SET payment_status = 'paid', status = 'paid', amount_paid = ?, paid_at = NOW()
         WHERE id = ?`,
        [amount, billId]
      );
    }
    
    // Update consumer outstanding amount
    if (consumerId) {
      await connection.query(
        `UPDATE water_customers 
         SET outstanding_amount = GREATEST(0, outstanding_amount - ?),
             last_payment_date = CURDATE(),
             last_payment_amount = ?
         WHERE id = ?`,
        [amount, amount, consumerId]
      );
    }
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Payment successful',
      data: {
        transaction_id: transactionId,
        receipt_number: receiptNumber,
        amount: amount,
        payment_method: payment_method,
        consumer_number: consumer_number
      }
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Process water payment error:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
});

// Get payment history
router.get('/history/:consumerNumber', async (req, res) => {
  try {
    const { consumerNumber } = req.params;
    
    const [payments] = await promisePool.query(
      `SELECT transaction_id, bill_number, amount, payment_method, status,
              receipt_number, completed_at
       FROM water_payments 
       WHERE consumer_number = ?
       ORDER BY completed_at DESC
       LIMIT 20`,
      [consumerNumber]
    );
    
    res.json({ success: true, data: payments });
    
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
