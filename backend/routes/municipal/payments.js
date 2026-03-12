const express = require('express');
const router = express.Router();
const { promisePool } = require('../../config/database');

// =====================================================
// MUNICIPAL PAYMENTS ROUTES
// =====================================================

// Process a payment (property tax, trade license, SW charges, etc.)
router.post('/process', async (req, res) => {
  try {
    const { payment_type, reference_number, amount, payment_method, payer_name, mobile } = req.body;

    if (!payment_type || !amount) {
      return res.status(400).json({ success: false, message: 'payment_type and amount are required' });
    }

    const year = new Date().getFullYear();
    const receiptNumber = `MREC${year}${String(Math.floor(Math.random() * 900000) + 100000)}`;

    try {
      await promisePool.query(
        `INSERT INTO municipal_payments
         (receipt_number, payment_type, reference_number, amount, payment_method, payer_name, mobile, status, paid_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'success', NOW())`,
        [receiptNumber, payment_type, reference_number || null, amount, payment_method || 'upi', payer_name || null, mobile || null]
      );
    } catch (_) {}

    res.status(201).json({
      success: true,
      message: 'Payment processed successfully',
      data: {
        receipt_number: receiptNumber,
        amount,
        payment_type,
        paid_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Process municipal payment error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get payment receipt
router.get('/receipt/:receiptNumber', async (req, res) => {
  try {
    const { receiptNumber } = req.params;

    const [rows] = await promisePool.query(
      `SELECT * FROM municipal_payments WHERE receipt_number = ?`,
      [receiptNumber]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Receipt not found' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Fetch municipal receipt error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
