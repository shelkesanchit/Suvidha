const express = require('express');
const router = express.Router();
const { promisePool } = require('../../config/database');
const { verifyToken, isAdmin } = require('../../middleware/auth');

// Get all settings
router.get('/', async (req, res) => {
  try {
    const [settings] = await promisePool.query(
      'SELECT setting_key, setting_value, description FROM electricity_system_settings ORDER BY setting_key'
    );

    const settingsMap = {};
    settings.forEach(s => {
      settingsMap[s.setting_key] = {
        value: s.setting_value,
        description: s.description
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
      'SELECT setting_value FROM electricity_system_settings WHERE setting_key = ?',
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
      'UPDATE electricity_system_settings SET setting_value = ?, updated_by = ? WHERE setting_key = ?',
      [value, req.user.id, req.params.key]
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
       FROM electricity_system_settings 
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

module.exports = router;
