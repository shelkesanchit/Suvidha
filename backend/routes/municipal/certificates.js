const express = require('express');
const router = express.Router();
const { promisePool } = require('../../config/database');

// =====================================================
// MUNICIPAL CERTIFICATES ROUTES
// =====================================================

// Download / verify a certificate by registration number
router.get('/verify/:certType/:regNumber', async (req, res) => {
  try {
    const { certType, regNumber } = req.params;

    const tableMap = {
      birth:    'municipal_birth_certs',
      death:    'municipal_death_certs',
      marriage: 'municipal_marriage_certs',
      trade:    'municipal_trade_licenses',
    };

    const table = tableMap[certType];
    if (!table) return res.status(400).json({ success: false, message: 'Invalid certificate type' });

    const [rows] = await promisePool.query(
      `SELECT * FROM ${table} WHERE registration_number = ?`,
      [regNumber]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Verify municipal certificate error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
