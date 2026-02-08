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

// Get application reports
const getApplicationReports = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    let query = `
      SELECT 
        DATE(submitted_at) as date,
        application_status,
        COUNT(*) as count
      FROM applications
      WHERE 1=1
    `;
    const params = [];
    if (start_date) { query += ' AND DATE(submitted_at) >= ?'; params.push(start_date); }
    if (end_date) { query += ' AND DATE(submitted_at) <= ?'; params.push(end_date); }
    query += ' GROUP BY DATE(submitted_at), application_status ORDER BY date DESC';
    const [report] = await promisePool.query(query, params);
    res.json(report);
  } catch (error) {
    console.error('Get application report error:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
};

// Get complaint reports
const getComplaintReports = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    let query = `
      SELECT 
        DATE(created_at) as date,
        complaint_type,
        complaint_status as status,
        COUNT(*) as count
      FROM complaints
      WHERE 1=1
    `;
    const params = [];
    if (start_date) { query += ' AND DATE(created_at) >= ?'; params.push(start_date); }
    if (end_date) { query += ' AND DATE(created_at) <= ?'; params.push(end_date); }
    query += ' GROUP BY DATE(created_at), complaint_type, complaint_status ORDER BY date DESC';
    const [report] = await promisePool.query(query, params);
    res.json(report);
  } catch (error) {
    console.error('Get complaint report error:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
};

// Get revenue reports
const getRevenueReports = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    let query = `
      SELECT 
        DATE(payment_date) as date,
        COUNT(*) as transaction_count,
        SUM(amount) as total_amount
      FROM payments
      WHERE payment_status = 'success'
    `;
    const params = [];
    if (start_date) { query += ' AND DATE(payment_date) >= ?'; params.push(start_date); }
    if (end_date) { query += ' AND DATE(payment_date) <= ?'; params.push(end_date); }
    query += ' GROUP BY DATE(payment_date) ORDER BY date DESC';
    const [report] = await promisePool.query(query, params);
    res.json(report);
  } catch (error) {
    console.error('Get revenue report error:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
};

module.exports = {
  getPaymentReports,
  getApplicationReports,
  getComplaintReports,
  getRevenueReports
};
