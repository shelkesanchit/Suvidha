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
    
    const { consumer_id, bill_number, amount, payment_method } = req.body;
    
    // Generate transaction ID
    const transactionId = `WTR${Date.now()}`;
    const receiptNumber = `WRCP${new Date().getFullYear()}${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`;
    
    // Get customer by consumer_id
    const [customers] = await connection.query(
      'SELECT id FROM water_customers WHERE consumer_id = ?',
      [consumer_id]
    );
    
    const customerId = customers.length > 0 ? customers[0].id : null;
    
    // Get bill if exists
    let billId = null;
    if (bill_number) {
      const [bills] = await connection.query(
        'SELECT id FROM water_bills WHERE bill_number = ?',
        [bill_number]
      );
      billId = bills.length > 0 ? bills[0].id : null;
    }
    
    // Map payment_method to valid enum ('cash','cheque','online','bank_transfer')
    const methodMap = {
      'cash': 'cash', 'cheque': 'cheque', 'online': 'online',
      'upi': 'online', 'card': 'online', 'netbanking': 'bank_transfer',
      'bank_transfer': 'bank_transfer', 'wallet': 'online', 'neft': 'bank_transfer'
    };
    const validMethod = methodMap[payment_method] || 'online';
    
    // Insert payment record using actual water_payments columns
    const [result] = await connection.query(
      `INSERT INTO water_payments 
      (bill_id, customer_id, payment_date, payment_method, amount, transaction_id, payment_status, receipt_number) 
      VALUES (?, ?, NOW(), ?, ?, ?, ?, ?)`,
      [
        billId,
        customerId,
        validMethod,
        amount,
        transactionId,
        'success',
        receiptNumber
      ]
    );
    
    // Update bill status if exists (using actual water_bills columns)
    if (billId) {
      await connection.query(
        `UPDATE water_bills 
         SET bill_status = 'paid', paid_amount = ?, paid_date = CURDATE()
         WHERE id = ?`,
        [amount, billId]
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
        consumer_id: consumer_id
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
router.get('/history/:consumerId', async (req, res) => {
  try {
    const { consumerId } = req.params;
    
    // Look up customer internal id
    const [customers] = await promisePool.query(
      'SELECT id FROM water_customers WHERE consumer_id = ? OR id = ?',
      [consumerId, consumerId]
    );
    
    const customerId = customers.length > 0 ? customers[0].id : consumerId;
    
    const [payments] = await promisePool.query(
      `SELECT transaction_id, bill_id, amount, payment_method, payment_status,
              receipt_number, payment_date
       FROM water_payments 
       WHERE customer_id = ?
       ORDER BY payment_date DESC
       LIMIT 20`,
      [customerId]
    );
    
    res.json({ success: true, data: payments });
    
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
