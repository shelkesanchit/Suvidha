const { promisePool } = require('../../config/database');

// Get consumer accounts
const getConsumerAccounts = async (req, res) => {
  try {
    const { status, connection_type, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT id, consumer_id, full_name, mobile, email, state, city, pincode, address,
             connection_status, connection_type, connection_date, meter_number, is_verified, account_created_at
      FROM electricity_customers
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND connection_status = ?';
      params.push(status);
    }

    if (connection_type) {
      query += ' AND connection_type = ?';
      params.push(connection_type);
    }

    query += ' ORDER BY account_created_at DESC LIMIT ? OFFSET ?';
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
