const express = require('express');
const router = express.Router();
const { promisePool } = require('../config/database');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Get all settings
router.get('/', async (req, res) => {
  try {
    const [settings] = await promisePool.query(
      'SELECT setting_key, setting_value, setting_type, category FROM settings ORDER BY setting_key'
    );

    const settingsMap = {};
    settings.forEach(s => {
      settingsMap[s.setting_key] = {
        value: s.setting_value,
        type: s.setting_type,
        category: s.category
      };
    });

    res.json(settingsMap);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Get specific setting
router.get('/:key', async (req, res) => {
  try {
    const [settings] = await promisePool.query(
      'SELECT setting_value FROM settings WHERE setting_key = ?',
      [req.params.key]
    );

    if (settings.length === 0) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    res.json({ value: settings[0].setting_value });
  } catch (error) {
    console.error('Get setting error:', error);
    res.status(500).json({ error: 'Failed to fetch setting' });
  }
});

// Update setting (admin only)
router.put('/:key', verifyToken, isAdmin, async (req, res) => {
  try {
    const { value } = req.body;

    const [result] = await promisePool.query(
      'UPDATE settings SET setting_value = ?, updated_at = NOW() WHERE setting_key = ?',
      [value, req.params.key]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    res.json({ message: 'Setting updated successfully' });
  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

// Get tariff rates
router.get('/tariffs/all', async (req, res) => {
  try {
    const [settings] = await promisePool.query(
      `SELECT setting_key, setting_value 
       FROM settings 
       WHERE setting_key LIKE 'tariff_%' 
       ORDER BY setting_key`
    );

    const tariffs = {};
    settings.forEach(s => {
      tariffs[s.setting_key] = parseFloat(s.setting_value);
    });

    res.json(tariffs);
  } catch (error) {
    console.error('Get tariffs error:', error);
    res.status(500).json({ error: 'Failed to fetch tariffs' });
  }
});

// Create tariff (POST) - for electricity admin TariffManagement
router.post('/tariff', verifyToken, isAdmin, async (req, res) => {
  try {
    const { state, city, category, slab_from, slab_to, rate_per_unit, fixed_charge, tax_percentage, effective_from } = req.body;
    const [result] = await promisePool.query(
      'INSERT INTO electricity_tariff_rates (state, city, category, slab_from, slab_to, rate_per_unit, fixed_charge, tax_percentage, effective_from) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [state || 'Maharashtra', city || 'Mumbai', category || 'domestic', slab_from || 0, slab_to || 0, rate_per_unit, fixed_charge || 0, tax_percentage || 0, effective_from || new Date()]
    );
    res.status(201).json({ success: true, message: 'Tariff created', id: result.insertId });
  } catch (error) {
    console.error('Create electricity tariff error:', error);
    res.status(500).json({ error: 'Failed to create tariff' });
  }
});

// Update tariff by ID (PUT) - for electricity admin TariffManagement
router.put('/tariff/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { state, city, category, slab_from, slab_to, rate_per_unit, fixed_charge, tax_percentage, effective_from } = req.body;
    await promisePool.query(
      'UPDATE electricity_tariff_rates SET state=?, city=?, category=?, slab_from=?, slab_to=?, rate_per_unit=?, fixed_charge=?, tax_percentage=?, effective_from=? WHERE id=?',
      [state, city, category, slab_from, slab_to, rate_per_unit, fixed_charge, tax_percentage, effective_from, req.params.id]
    );
    res.json({ success: true, message: 'Tariff updated' });
  } catch (error) {
    console.error('Update electricity tariff error:', error);
    res.status(500).json({ error: 'Failed to update tariff' });
  }
});

module.exports = router;
