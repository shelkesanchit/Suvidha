const express = require('express');
const router = express.Router();
const { promisePool } = require('../../config/database');

// =====================================================
// GAS PAYMENTS ROUTES
// =====================================================

// Process payment
router.post('/process', async (req, res) => {
  const connection = await promisePool.getConnection();
  try {
    await connection.beginTransaction();
    
    const { consumer_number, bill_number, amount, payment_method, payment_type, mobile } = req.body;
    
    // Generate transaction ID
    const transactionId = `GTR${Date.now()}`;
    const receiptNumber = `GRCP${new Date().getFullYear()}${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`;
    
    // Get consumer
    const [consumers] = await connection.query(
      'SELECT id FROM gas_consumers WHERE consumer_number = ?',
      [consumer_number]
    );
    
    const consumerId = consumers.length > 0 ? consumers[0].id : null;
    
    // Get bill if exists
    let billId = null;
    if (bill_number) {
      const [bills] = await connection.query(
        'SELECT id FROM gas_bills WHERE bill_number = ?',
        [bill_number]
      );
      billId = bills.length > 0 ? bills[0].id : null;
    }
    
    // Insert payment record
    const [result] = await connection.query(
      `INSERT INTO gas_payments 
      (transaction_id, consumer_id, consumer_number, bill_id, bill_number, amount,
       payment_method, payment_type, status, receipt_number, receipt_generated, completed_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        transactionId,
        consumerId,
        consumer_number,
        billId,
        bill_number || null,
        amount,
        payment_method,
        payment_type || 'bill_payment',
        'success',
        receiptNumber,
        true
      ]
    );
    
    // Update bill status if exists
    if (billId) {
      await connection.query(
        `UPDATE gas_bills 
         SET payment_status = 'paid', status = 'paid', amount_paid = ?, paid_at = NOW()
         WHERE id = ?`,
        [amount, billId]
      );
    }
    
    // Update consumer outstanding amount
    if (consumerId) {
      await connection.query(
        `UPDATE gas_consumers 
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
    console.error('Process gas payment error:', error);
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
      `SELECT transaction_id, bill_number, amount, payment_method, payment_type, status,
              receipt_number, completed_at
       FROM gas_payments 
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

// Pay for cylinder booking
router.post('/cylinder-payment', async (req, res) => {
  const connection = await promisePool.getConnection();
  try {
    await connection.beginTransaction();
    
    const { booking_number, payment_method } = req.body;
    
    // Get booking
    const [bookings] = await connection.query(
      'SELECT * FROM gas_cylinder_bookings WHERE booking_number = ?',
      [booking_number]
    );
    
    if (bookings.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    const booking = bookings[0];
    
    // Generate transaction ID
    const transactionId = `GCTR${Date.now()}`;
    const receiptNumber = `GCRCP${new Date().getFullYear()}${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`;
    
    // Insert payment record
    await connection.query(
      `INSERT INTO gas_payments 
      (transaction_id, consumer_id, consumer_number, amount, payment_method, payment_type, 
       status, receipt_number, receipt_generated, completed_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        transactionId,
        booking.consumer_id,
        booking.consumer_number,
        booking.total_amount,
        payment_method,
        'cylinder_payment',
        'success',
        receiptNumber,
        true
      ]
    );
    
    // Update booking status
    await connection.query(
      `UPDATE gas_cylinder_bookings 
       SET status = 'paid', payment_status = 'paid', paid_at = NOW()
       WHERE id = ?`,
      [booking.id]
    );
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Cylinder payment successful',
      data: {
        transaction_id: transactionId,
        receipt_number: receiptNumber,
        amount: booking.total_amount,
        booking_number: booking_number
      }
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Cylinder payment error:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
});

module.exports = router;
