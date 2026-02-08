const bcrypt = require('bcryptjs');
const { promisePool } = require('../../config/database');

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT id, email, role, full_name, phone, is_active, created_at
      FROM electricity_users
      WHERE 1=1
    `;
    const params = [];

    if (role) {
      query += ' AND role = ?';
      params.push(role);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [users] = await promisePool.query(query, params);

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// Create staff user
const createStaffUser = async (req, res) => {
  try {
    const { email, password, full_name, phone } = req.body;

    // Check if user exists
    const [existing] = await promisePool.query(
      'SELECT id FROM electricity_users WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    await promisePool.query(
      'INSERT INTO electricity_users (email, password, role, full_name, phone) VALUES (?, ?, ?, ?, ?)',
      [email, hashedPassword, 'staff', full_name, phone]
    );

    res.status(201).json({ message: 'Staff user created successfully' });
  } catch (error) {
    console.error('Create staff error:', error);
    res.status(500).json({ error: 'Failed to create staff user' });
  }
};

// Toggle user active status
const toggleUserStatus = async (req, res) => {
  try {
    const userId = req.params.id;

    await promisePool.query(
      'UPDATE users SET is_active = NOT is_active WHERE id = ?',
      [userId]
    );

    res.json({ message: 'User status updated successfully' });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
};

module.exports = {
  getAllUsers,
  createStaffUser,
  toggleUserStatus
};
