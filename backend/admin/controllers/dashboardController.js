const { promisePool } = require('../../config/database');

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    const [stats] = await promisePool.query(`
      SELECT 
        (SELECT COUNT(*) FROM applications WHERE status = 'submitted') as pending_applications,
        (SELECT COUNT(*) FROM applications WHERE status = 'under_review') as under_review_applications,
        (SELECT COUNT(*) FROM complaints WHERE status IN ('open', 'assigned')) as open_complaints,
        (SELECT COUNT(*) FROM consumer_accounts WHERE connection_status = 'active') as active_connections,
        (SELECT COUNT(*) FROM users WHERE role = 'customer' AND is_active = 1) as total_customers,
        (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE payment_status = 'success' AND DATE(payment_date) = CURDATE()) as today_revenue,
        (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE payment_status = 'success' AND MONTH(payment_date) = MONTH(CURDATE()) AND YEAR(payment_date) = YEAR(CURDATE())) as month_revenue
    `);

    res.json(stats[0]);
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
};

module.exports = {
  getDashboardStats
};
