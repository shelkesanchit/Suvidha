const express = require('express');
const router  = express.Router();
const { pool } = require('../../config/database');

// ─── POST /payments/process ──────────────────────────────────────────────────
// General cash/counter payment (no Razorpay gateway)
router.post('/process', async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');

    const {
      application_number, bill_number, payer_name, mobile,
      amount, payment_type, payment_method, remarks
    } = req.body;

    if (!amount || !payer_name || !mobile) {
      return res.status(400).json({ success: false, message: 'amount, payer_name and mobile are required' });
    }

    // Resolve application_id
    let applicationId = null;
    if (application_number) {
      const app = await client.query(
        'SELECT id FROM municipal_applications WHERE application_number = $1', [application_number]
      );
      if (app.rows.length > 0) applicationId = app.rows[0].id;
    }

    const year          = new Date().getFullYear();
    const txnSuffix     = Date.now().toString().slice(-8) + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const transactionId = `MPAY${year}${txnSuffix}`;
    const receiptNumber = `MREC${year}${txnSuffix}`;

    await client.query(
      `INSERT INTO municipal_payments
         (transaction_id, application_id, application_number,
          payer_name, mobile, amount, payment_type,
          payment_method, payment_status, receipt_number, remarks)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'success', $9, $10)`,
      [transactionId, applicationId, application_number || null,
       payer_name, mobile, amount, payment_type || 'application_fee',
       payment_method || 'cash', receiptNumber, remarks || null]
    );

    // If bill_number provided, mark bill as paid
    if (bill_number) {
      await client.query(
        `UPDATE municipal_bills SET status = 'paid', payment_date = NOW() WHERE bill_number = $1`,
        [bill_number]
      );
    }

    // Notification
    await client.query(
      `INSERT INTO municipal_notifications (mobile, title, message, type, reference_number)
       VALUES ($1, 'Payment Successful', $2, 'success', $3)`,
      [mobile,
       `Payment of ₹${amount} received. Receipt: ${receiptNumber}`,
       receiptNumber]
    );

    await client.query('COMMIT');
    res.status(201).json({
      success: true,
      message: 'Payment processed successfully',
      data: { transaction_id: transactionId, receipt_number: receiptNumber }
    });
  } catch (err) {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (_) {}
    }
    console.error('Process payment error:', err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    if (client) client.release();
  }
});

// ─── POST /payments/create-order ─────────────────────────────────────────────
// Create Razorpay order (mirrors electricity pattern)
router.post('/create-order', async (req, res) => {
  try {
    const Razorpay = require('razorpay');
    const razorpay = new Razorpay({
      key_id:     process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const { amount, application_number, payer_name, mobile, payment_type } = req.body;
    if (!amount) return res.status(400).json({ success: false, message: 'amount is required' });

    const order = await razorpay.orders.create({
      amount:   Math.round(parseFloat(amount) * 100), // paise
      currency: 'INR',
      receipt:  `muni_${Date.now()}`,
      notes:    { application_number: application_number || '', payer: payer_name || '' }
    });

    // Record pending payment
    const txnId = `MPAY${Date.now()}`;
    await pool.query(
      `INSERT INTO municipal_payments
         (transaction_id, application_number, payer_name, mobile, amount,
          payment_type, payment_method, payment_status, razorpay_order_id)
       VALUES ($1, $2, $3, $4, $5, $6, 'online', 'pending', $7)`,
      [txnId, application_number || null, payer_name || '', mobile || '',
       amount, payment_type || 'application_fee', order.id]
    );

    res.json({ success: true, data: { order_id: order.id, amount: order.amount, currency: order.currency } });
  } catch (err) {
    console.error('Create Razorpay order error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /payments/verify ───────────────────────────────────────────────────
// Verify Razorpay payment signature and mark success
router.post('/verify', async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    const crypto = require('crypto');

    const {
      razorpay_order_id, razorpay_payment_id, razorpay_signature,
      bill_number, mobile
    } = req.body;

    // Verify signature
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expected !== razorpay_signature) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    const year          = new Date().getFullYear();
    const receiptNumber = `MREC${year}${Date.now().toString().slice(-8)}`;

    await client.query(
      `UPDATE municipal_payments
       SET payment_status      = 'success',
           razorpay_payment_id = $1,
           razorpay_signature  = $2,
           receipt_number      = $3,
           payment_date        = NOW()
       WHERE razorpay_order_id = $4`,
      [razorpay_payment_id, razorpay_signature, receiptNumber, razorpay_order_id]
    );

    if (bill_number) {
      await client.query(
        `UPDATE municipal_bills SET status = 'paid', payment_date = NOW() WHERE bill_number = $1`,
        [bill_number]
      );
    }

    if (mobile) {
      await client.query(
        `INSERT INTO municipal_notifications (mobile, title, message, type, reference_number)
         VALUES ($1, 'Payment Verified', $2, 'success', $3)`,
        [mobile, `Payment verified. Receipt: ${receiptNumber}`, receiptNumber]
      );
    }

    await client.query('COMMIT');
    res.json({ success: true, message: 'Payment verified', data: { receipt_number: receiptNumber } });
  } catch (err) {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (_) {}
    }
    console.error('Verify payment error:', err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    if (client) client.release();
  }
});

// ─── GET /payments/history/:consumerNumber ───────────────────────────────────
router.get('/history/:consumerNumber', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, transaction_id, application_number, amount,
              payment_type, payment_method, payment_status,
              receipt_number, payment_date
       FROM municipal_payments
       WHERE mobile = (
         SELECT mobile FROM municipal_consumers WHERE consumer_number = $1 LIMIT 1
       )
       ORDER BY payment_date DESC
       LIMIT 20`,
      [req.params.consumerNumber]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Payment history error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /payments/receipt/:receiptNumber ────────────────────────────────────
router.get('/receipt/:receiptNumber', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, a.application_type, a.department
       FROM municipal_payments p
       LEFT JOIN municipal_applications a ON a.application_number = p.application_number
       WHERE p.receipt_number = $1`,
      [req.params.receiptNumber]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Receipt not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Get receipt error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
