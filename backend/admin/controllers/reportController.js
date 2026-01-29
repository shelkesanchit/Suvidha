const { promisePool } = require('../../config/database');

// Get payment reports
const getPaymentReports = async (req, res) => {
  try {
    const { start_date, end_date, method } = req.query;

    let query = `
      SELECT 
        DATE(payment_date) as date,
        payment_method,
        COUNT(*) as transaction_count,
        SUM(amount) as total_amount
      FROM payments
      WHERE payment_status = 'success'
    `;
    const params = [];

    if (start_date) {
      query += ' AND DATE(payment_date) >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND DATE(payment_date) <= ?';
      params.push(end_date);
    }

    if (method) {
      query += ' AND payment_method = ?';
      params.push(method);
    }

    query += ' GROUP BY DATE(payment_date), payment_method ORDER BY date DESC';

    const [report] = await promisePool.query(query, params);

    res.json(report);
  } catch (error) {
    console.error('Get payment report error:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
};

module.exports = {
  getPaymentReports
};
