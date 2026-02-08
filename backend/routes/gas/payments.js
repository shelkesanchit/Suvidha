const express = require('express');
const router = express.Router();
const { promisePool } = require('../../config/database');

// =====================================================
// GAS PAYMENTS ROUTES
// Fixed to match actual gas_payments schema:
//   id, booking_id, customer_id, payment_date, payment_method,
//   amount, subsidy_amount, transaction_id, payment_status, receipt_number
// =====================================================

// Process payment
router.post('/process', async (req, res) => {
  const connection = await promisePool.getConnection();
  try {
    await connection.beginTransaction();

    const { consumer_id, booking_number, amount, payment_method } = req.body;

    // Generate transaction ID
    const transactionId = `GTR${Date.now()}`;
    const receiptNumber = `GRCP${new Date().getFullYear()}${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`;

    // Get customer by consumer_id
    const [customers] = await connection.query(
      'SELECT id FROM gas_consumers WHERE consumer_number = ?',
      [consumer_id]
    );

    if (customers.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const customerId = customers[0].id;

    // Get booking if provided
    let bookingId = null;
    if (booking_number) {
      const [bookings] = await connection.query(
        'SELECT id FROM gas_cylinder_bookings WHERE booking_number = ?',
        [booking_number]
      );
      bookingId = bookings.length > 0 ? bookings[0].id : null;
    }

    // Map payment_method to valid enum ('cash','online','bank_transfer')
    const methodMap = {
      'cash': 'cash', 'online': 'online', 'upi': 'online',
      'card': 'online', 'bank_transfer': 'bank_transfer', 'neft': 'bank_transfer'
    };
    const validMethod = methodMap[payment_method] || 'online';

    // Insert payment record (only columns that exist in gas_payments)
    const [result] = await connection.query(
      `INSERT INTO gas_payments 
      (booking_id, customer_id, payment_method, amount, transaction_id, payment_status, receipt_number) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        bookingId,
        customerId,
        validMethod,
        amount,
        transactionId,
        'success',
        receiptNumber
      ]
    );

    // Update booking payment_status if booking exists
    if (bookingId) {
      await connection.query(
        `UPDATE gas_cylinder_bookings SET payment_status = 'paid' WHERE id = ?`,
        [bookingId]
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
        payment_method: validMethod,
        consumer_id: consumer_id
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
router.get('/history/:consumerId', async (req, res) => {
  try {
    const { consumerId } = req.params;

    // Look up customer by consumer_id
    const [customers] = await promisePool.query(
      'SELECT id FROM gas_consumers WHERE consumer_number = ?',
      [consumerId]
    );

    if (customers.length === 0) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const [payments] = await promisePool.query(
      `SELECT gp.transaction_id, gp.amount, gp.subsidy_amount, gp.payment_method,
              gp.payment_status, gp.receipt_number, gp.payment_date,
              cb.booking_number
       FROM gas_payments gp
       LEFT JOIN gas_cylinder_bookings cb ON gp.booking_id = cb.id
       WHERE gp.customer_id = ?
       ORDER BY gp.payment_date DESC
       LIMIT 20`,
      [customers[0].id]
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
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const booking = bookings[0];

    // Generate transaction ID
    const transactionId = `GCTR${Date.now()}`;
    const receiptNumber = `GCRCP${new Date().getFullYear()}${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`;

    // Map payment method
    const methodMap = {
      'cash': 'cash', 'online': 'online', 'upi': 'online',
      'card': 'online', 'bank_transfer': 'bank_transfer', 'neft': 'bank_transfer'
    };
    const validMethod = methodMap[payment_method] || 'online';

    // Insert payment record (booking.customer_id is the FK)
    await connection.query(
      `INSERT INTO gas_payments 
      (booking_id, customer_id, payment_method, amount, transaction_id, payment_status, receipt_number) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        booking.id,
        booking.customer_id,
        validMethod,
        booking.total_amount,
        transactionId,
        'success',
        receiptNumber
      ]
    );

    // Update booking payment status
    await connection.query(
      `UPDATE gas_cylinder_bookings SET payment_status = 'paid' WHERE id = ?`,
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
