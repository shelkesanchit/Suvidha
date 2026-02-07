const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { promisePool } = require('../config/database');
const { verifyToken } = require('../middleware/auth');

// Initialize Razorpay only if keys are available
let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
} else {
  console.warn('⚠️ Razorpay keys not configured - payment features disabled');
}

// Create payment order
router.post('/create-order', verifyToken, async (req, res) => {
  try {
    const { amount, bill_id, consumer_number } = req.body;

    // Verify consumer account
    const [accounts] = await promisePool.query(
      'SELECT id FROM consumer_accounts WHERE consumer_number = ? AND user_id = ?',
      [consumer_number, req.user.id]
    );

    if (accounts.length === 0) {
      return res.status(404).json({ error: 'Consumer account not found' });
    }

    // Create Razorpay order
    const options = {
      amount: Math.round(amount * 100), // amount in paise
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
      notes: {
        consumer_number,
        bill_id: bill_id || '',
        user_id: req.user.id
      }
    };

    const order = await razorpay.orders.create(options);

    // Create payment record
    const transactionId = `TXN${Date.now()}`;
    await promisePool.query(
      `INSERT INTO payments 
       (transaction_id, bill_id, consumer_account_id, amount, payment_method, 
        payment_status, razorpay_order_id) 
       VALUES (?, ?, ?, ?, 'upi', 'pending', ?)`,
      [transactionId, bill_id || null, accounts[0].id, amount, order.id]
    );

    res.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      transaction_id: transactionId
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create payment order' });
  }
});

// Verify payment
router.post('/verify', verifyToken, async (req, res) => {
  const connection = await promisePool.getConnection();
  try {
    await connection.beginTransaction();

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    // Update payment record
    const [result] = await connection.query(
      `UPDATE payments 
       SET payment_status = 'success', 
           razorpay_payment_id = ?, 
           razorpay_signature = ?,
           receipt_number = CONCAT('RCPT', YEAR(CURDATE()), LPAD(id, 8, '0'))
       WHERE razorpay_order_id = ?`,
      [razorpay_payment_id, razorpay_signature, razorpay_order_id]
    );

    // Get payment details
    const [payments] = await connection.query(
      'SELECT * FROM payments WHERE razorpay_order_id = ?',
      [razorpay_order_id]
    );

    const payment = payments[0];

    // Update bill status if payment is for a bill
    if (payment.bill_id) {
      await connection.query(
        `UPDATE bills 
         SET status = 'paid', payment_date = NOW() 
         WHERE id = ?`,
        [payment.bill_id]
      );
    }

    // Create notification
    await connection.query(
      `INSERT INTO notifications (user_id, title, message, type) 
       VALUES (?, ?, ?, ?)`,
      [req.user.id, 'Payment Successful', 
       `Payment of ₹${payment.amount} completed successfully. Receipt: ${payment.receipt_number}`,
       'success']
    );

    await connection.commit();

    res.json({
      message: 'Payment verified successfully',
      receipt_number: payment.receipt_number,
      transaction_id: payment.transaction_id
    });
  } catch (error) {
    await connection.rollback();
    console.error('Verify payment error:', error);
    res.status(500).json({ error: 'Payment verification failed' });
  } finally {
    connection.release();
  }
});

// Get payment history
router.get('/history/:consumerNumber', verifyToken, async (req, res) => {
  try {
    const [accounts] = await promisePool.query(
      'SELECT id FROM consumer_accounts WHERE consumer_number = ? AND user_id = ?',
      [req.params.consumerNumber, req.user.id]
    );

    if (accounts.length === 0) {
      return res.status(404).json({ error: 'Consumer account not found' });
    }

    const [payments] = await promisePool.query(
      `SELECT p.*, b.bill_number, b.billing_month
       FROM payments p
       LEFT JOIN bills b ON p.bill_id = b.id
       WHERE p.consumer_account_id = ? AND p.payment_status = 'success'
       ORDER BY p.payment_date DESC
       LIMIT 20`,
      [accounts[0].id]
    );

    res.json(payments);
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
});

// Get payment receipt
router.get('/receipt/:receiptNumber', verifyToken, async (req, res) => {
  try {
    const [payments] = await promisePool.query(
      `SELECT p.*, ca.consumer_number, ca.address_line1, ca.city, u.full_name
       FROM payments p
       JOIN consumer_accounts ca ON p.consumer_account_id = ca.id
       JOIN users u ON ca.user_id = u.id
       WHERE p.receipt_number = ? AND ca.user_id = ?`,
      [req.params.receiptNumber, req.user.id]
    );

    if (payments.length === 0) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    res.json(payments[0]);
  } catch (error) {
    console.error('Get receipt error:', error);
    res.status(500).json({ error: 'Failed to fetch receipt' });
  }
});

// Prepaid meter recharge
router.post('/prepaid-recharge', verifyToken, async (req, res) => {
  const connection = await promisePool.getConnection();
  try {
    await connection.beginTransaction();

    const { consumer_number, amount } = req.body;

    // Verify consumer account
    const [accounts] = await connection.query(
      'SELECT id FROM consumer_accounts WHERE consumer_number = ? AND user_id = ?',
      [consumer_number, req.user.id]
    );

    if (accounts.length === 0) {
      return res.status(404).json({ error: 'Consumer account not found' });
    }

    // Generate recharge number
    const rechargeNumber = `RCH${Date.now()}`;
    const unitsCredited = (amount / 7.5).toFixed(2); // Average rate

    // Insert recharge record
    await connection.query(
      `INSERT INTO prepaid_recharges 
       (recharge_number, consumer_account_id, amount, units_credited, transaction_id, status) 
       VALUES (?, ?, ?, ?, ?, 'success')`,
      [rechargeNumber, accounts[0].id, amount, unitsCredited, `TXN${Date.now()}`]
    );

    await connection.commit();

    res.json({
      message: 'Recharge successful',
      recharge_number: rechargeNumber,
      units_credited: unitsCredited
    });
  } catch (error) {
    await connection.rollback();
    console.error('Prepaid recharge error:', error);
    res.status(500).json({ error: 'Recharge failed' });
  } finally {
    connection.release();
  }
});

module.exports = router;
