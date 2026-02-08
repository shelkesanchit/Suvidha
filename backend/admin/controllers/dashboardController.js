const { promisePool } = require('../../config/database');

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    const [stats] = await promisePool.query(`
      SELECT 
        (SELECT COUNT(*) FROM applications WHERE application_status = 'submitted') as pending_applications,
        (SELECT COUNT(*) FROM applications WHERE application_status = 'approved') as approved_applications,
        (SELECT COUNT(*) FROM complaints WHERE complaint_status IN ('open', 'assigned')) as open_complaints,
        (SELECT COUNT(*) FROM electricity_customers WHERE connection_status = 'active') as active_connections,
        (SELECT COUNT(*) FROM users WHERE role = 'customer' AND is_active = 1) as total_customers,
        0 as today_revenue,
        0 as month_revenue
    `);

    res.json({
      success: true,
      data: stats[0] || {
        pending_applications: 0,
        approved_applications: 0,
        open_complaints: 0,
        active_connections: 0,
        total_customers: 0,
        today_revenue: 0,
        month_revenue: 0
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch statistics',
      message: error.message
    });
  }
};

module.exports = {
  getDashboardStats
};
