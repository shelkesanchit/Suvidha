const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { pool } = require('../../config/database');
const { verifyToken } = require('../../middleware/auth');

let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
} else {
  console.warn('Razorpay keys not configured - payment features disabled');
}

// Create payment order
router.post('/create-order', verifyToken, async (req, res) => {
  try {
    const { amount, bill_id, consumer_number } = req.body;

    const accResult = await pool.query(
      'SELECT id FROM electricity_consumer_accounts WHERE consumer_number = $1 AND user_id = $2',
      [consumer_number, req.user.id]
    );

    if (accResult.rows.length === 0) {
      return res.status(404).json({ error: 'Consumer account not found' });
    }

    const options = {
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: 'rcpt_' + Date.now(),
      notes: { consumer_number, bill_id: bill_id || '', user_id: req.user.id }
    };

    const order = await razorpay.orders.create(options);
    const transactionId = 'TXN' + Date.now();

    await pool.query(
      `INSERT INTO electricity_payments (transaction_id, bill_id, consumer_account_id, amount, payment_method, payment_status, razorpay_order_id)
       VALUES ($1, $2, $3, $4, 'upi', 'pending', $5)`,
      [transactionId, bill_id || null, accResult.rows[0].id, amount, order.id]
    );

    res.json({ order_id: order.id, amount: order.amount, currency: order.currency, transaction_id: transactionId });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create payment order' });
  }
});

// Verify payment
router.post('/verify', verifyToken, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    const payRow = await client.query(
      'SELECT * FROM electricity_payments WHERE razorpay_order_id = $1',
      [razorpay_order_id]
    );
    const payment = payRow.rows[0];
    const receiptNumber = 'RCPT' + new Date().getFullYear() + String(payment.id).padStart(8, '0');

    await client.query(
      `UPDATE electricity_payments SET payment_status = 'success', razorpay_payment_id = $1, razorpay_signature = $2, receipt_number = $3 WHERE razorpay_order_id = $4`,
      [razorpay_payment_id, razorpay_signature, receiptNumber, razorpay_order_id]
    );

    if (payment.bill_id) {
      await client.query(
        `UPDATE electricity_bills SET status = 'paid', payment_date = NOW() WHERE id = $1`,
        [payment.bill_id]
      );
    }

    await client.query(
      'INSERT INTO electricity_notifications (user_id, title, message, type) VALUES ($1, $2, $3, $4)',
      [req.user.id, 'Payment Successful', 'Payment of Rs.' + payment.amount + ' completed. Receipt: ' + receiptNumber, 'success']
    );

    await client.query('COMMIT');

    res.json({ message: 'Payment verified successfully', receipt_number: receiptNumber, transaction_id: payment.transaction_id });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Verify payment error:', error);
    res.status(500).json({ error: 'Payment verification failed' });
  } finally {
    client.release();
  }
});

// Get payment history
router.get('/history/:consumerNumber', verifyToken, async (req, res) => {
  try {
    const acc = await pool.query(
      'SELECT id FROM electricity_consumer_accounts WHERE consumer_number = $1 AND user_id = $2',
      [req.params.consumerNumber, req.user.id]
    );

    if (acc.rows.length === 0) {
      return res.status(404).json({ error: 'Consumer account not found' });
    }

    const result = await pool.query(
      `SELECT p.*, b.bill_number, b.billing_month
       FROM electricity_payments p
       LEFT JOIN electricity_bills b ON p.bill_id = b.id
       WHERE p.consumer_account_id = $1 AND p.payment_status = 'success'
       ORDER BY p.payment_date DESC LIMIT 20`,
      [acc.rows[0].id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
});

// Get payment receipt
router.get('/receipt/:receiptNumber', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, ca.consumer_number, ca.address_line1, ca.city, u.full_name
       FROM electricity_payments p
       JOIN electricity_consumer_accounts ca ON p.consumer_account_id = ca.id
       JOIN electricity_users u ON ca.user_id = u.id
       WHERE p.receipt_number = $1 AND ca.user_id = $2`,
      [req.params.receiptNumber, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get receipt error:', error);
    res.status(500).json({ error: 'Failed to fetch receipt' });
  }
});

// Prepaid recharge
router.post('/prepaid-recharge', verifyToken, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { consumer_number, amount } = req.body;

    const acc = await client.query(
      'SELECT id FROM electricity_consumer_accounts WHERE consumer_number = $1 AND user_id = $2',
      [consumer_number, req.user.id]
    );

    if (acc.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Consumer account not found' });
    }

    const rechargeNumber = 'RCH' + Date.now();
    const unitsCredited = (amount / 7.5).toFixed(2);

    await client.query(
      `INSERT INTO electricity_prepaid_recharges (recharge_number, consumer_account_id, amount, units_credited, transaction_id, status)
       VALUES ($1, $2, $3, $4, $5, 'success')`,
      [rechargeNumber, acc.rows[0].id, amount, unitsCredited, 'TXN' + Date.now()]
    );

    await client.query('COMMIT');

    res.json({ message: 'Recharge successful', recharge_number: rechargeNumber, units_credited: unitsCredited });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Prepaid recharge error:', error);
    res.status(500).json({ error: 'Recharge failed' });
  } finally {
    client.release();
  }
});

module.exports = router;
