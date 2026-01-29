const jwt = require('jsonwebtoken');
const { promisePool } = require('../config/database');

// Verify JWT token
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const [users] = await promisePool.query(
      'SELECT id, email, role, full_name, is_active FROM users WHERE id = ?',
      [decoded.id]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid token. User not found.' });
    }

    if (!users[0].is_active) {
      return res.status(403).json({ error: 'Account is deactivated.' });
    }

    req.user = users[0];
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired.' });
    }
    return res.status(401).json({ error: 'Invalid token.' });
  }
};

// Check if user has required role
const checkRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }

    next();
  };
};

// Check if user is admin or staff
const isAdminOrStaff = checkRole('admin', 'staff');

// Check if user is admin
const isAdmin = checkRole('admin');

// Check if user is customer
const isCustomer = checkRole('customer');

module.exports = {
  verifyToken,
  checkRole,
  isAdmin,
  isAdminOrStaff,
  isCustomer
};
