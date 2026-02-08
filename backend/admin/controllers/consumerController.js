const { promisePool } = require('../../config/database');

// Get consumer accounts
const getConsumerAccounts = async (req, res) => {
  try {
    const { status, category, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT ca.id, ca.consumer_number, ca.category, ca.tariff_type, ca.sanctioned_load, 
             ca.meter_number, ca.connection_status, ca.address_line1, ca.address_line2, 
             ca.city, ca.state, ca.pincode, ca.created_at,
             u.full_name, u.email, u.phone
      FROM electricity_consumer_accounts ca
      LEFT JOIN electricity_users u ON ca.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND ca.connection_status = ?';
      params.push(status);
    }

    if (category) {
      query += ' AND ca.category = ?';
      params.push(category);
    }

    query += ' ORDER BY ca.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [consumers] = await promisePool.query(query, params);

    res.json(consumers);
  } catch (error) {
    console.error('Get consumers error:', error);
    res.status(500).json({ error: 'Failed to fetch consumers' });
  }
};

module.exports = {
  getConsumerAccounts
};
