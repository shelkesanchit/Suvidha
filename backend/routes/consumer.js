const express = require('express');
const router = express.Router();
const { promisePool } = require('../config/database');
const { verifyToken } = require('../middleware/auth');

// Get consumer account info
router.get('/account', verifyToken, async (req, res) => {
  try {
    const [accounts] = await promisePool.query(
      `SELECT * FROM consumer_accounts WHERE user_id = ?`,
      [req.user.id]
    );

    res.json(accounts);
  } catch (error) {
    console.error('Get consumer account error:', error);
    res.status(500).json({ error: 'Failed to fetch consumer account' });
  }
});

// Get specific consumer account by consumer number
router.get('/account/:consumerNumber', verifyToken, async (req, res) => {
  try {
    const [accounts] = await promisePool.query(
      `SELECT * FROM consumer_accounts 
       WHERE consumer_number = ? AND user_id = ?`,
      [req.params.consumerNumber, req.user.id]
    );

    if (accounts.length === 0) {
      return res.status(404).json({ error: 'Consumer account not found' });
    }

    res.json(accounts[0]);
  } catch (error) {
    console.error('Get consumer account error:', error);
    res.status(500).json({ error: 'Failed to fetch consumer account' });
  }
});

// Get bills for consumer
router.get('/account/:consumerNumber/bills', verifyToken, async (req, res) => {
  try {
    const [account] = await promisePool.query(
      'SELECT id FROM consumer_accounts WHERE consumer_number = ? AND user_id = ?',
      [req.params.consumerNumber, req.user.id]
    );

    if (account.length === 0) {
      return res.status(404).json({ error: 'Consumer account not found' });
    }

    const [bills] = await promisePool.query(
      `SELECT * FROM bills 
       WHERE consumer_account_id = ? 
       ORDER BY billing_month DESC 
       LIMIT 12`,
      [account[0].id]
    );

    res.json(bills);
  } catch (error) {
    console.error('Get bills error:', error);
    res.status(500).json({ error: 'Failed to fetch bills' });
  }
});

// Submit meter reading
router.post('/meter-reading', verifyToken, async (req, res) => {
  try {
    const { consumer_number, reading_value } = req.body;

    // Verify consumer account
    const [account] = await promisePool.query(
      'SELECT id FROM consumer_accounts WHERE consumer_number = ? AND user_id = ?',
      [consumer_number, req.user.id]
    );

    if (account.length === 0) {
      return res.status(404).json({ error: 'Consumer account not found' });
    }

    // Insert meter reading
    await promisePool.query(
      `INSERT INTO meter_readings 
       (consumer_account_id, reading_date, reading_value, reading_type, submitted_by) 
       VALUES (?, CURDATE(), ?, 'self', ?)`,
      [account[0].id, reading_value, req.user.id]
    );

    res.status(201).json({ message: 'Meter reading submitted successfully' });
  } catch (error) {
    console.error('Submit meter reading error:', error);
    res.status(500).json({ error: 'Failed to submit meter reading' });
  }
});

// Get meter reading history
router.get('/meter-reading/:consumerNumber', verifyToken, async (req, res) => {
  try {
    const [account] = await promisePool.query(
      'SELECT id FROM consumer_accounts WHERE consumer_number = ? AND user_id = ?',
      [req.params.consumerNumber, req.user.id]
    );

    if (account.length === 0) {
      return res.status(404).json({ error: 'Consumer account not found' });
    }

    const [readings] = await promisePool.query(
      `SELECT * FROM meter_readings 
       WHERE consumer_account_id = ? 
       ORDER BY reading_date DESC 
       LIMIT 12`,
      [account[0].id]
    );

    res.json(readings);
  } catch (error) {
    console.error('Get meter readings error:', error);
    res.status(500).json({ error: 'Failed to fetch meter readings' });
  }
});

module.exports = router;
