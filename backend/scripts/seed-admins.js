/**
 * Seed Admin Credentials
 * Adds admin users for all three departments with the same password: admin123
 *
 * Usage: node scripts/seed-admins.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function seedAdmins() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'suvidha_db',
      port: process.env.DB_PORT || 3306,
    });

    console.log('\n🔑 SUVIDHA - SEED ADMIN CREDENTIALS');
    console.log('====================================\n');

    const password = 'admin123';
    const hash = await bcrypt.hash(password, 10);

    // --- Electricity Admin (electricity_users table) ---
    await connection.query(
      `INSERT INTO electricity_users (full_name, email, phone, password, role, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, 1, NOW())
       ON DUPLICATE KEY UPDATE email = email`,
      ['Electricity Admin', 'admin@electricity.gov.in', '9876543200', hash, 'admin']
    );
    console.log('  ✓ Electricity admin created');
    console.log('    Email:    admin@electricity.gov.in');

    // --- Gas Admin (gas_admin_users table) ---
    await connection.query(
      `INSERT INTO gas_admin_users (username, password, full_name, email, phone, role, is_active)
       VALUES (?, ?, ?, ?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE username = username`,
      ['gas_admin', hash, 'Gas Administrator', 'gas.admin@suvidha.gov.in', '9876543220', 'super_admin']
    );
    console.log('  ✓ Gas admin created');
    console.log('    Username: gas_admin');

    // --- Water Admin (water_admin_users table) ---
    await connection.query(
      `INSERT INTO water_admin_users (employee_id, username, password_hash, full_name, email, mobile, role, designation, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE username = username`,
      ['WTR-ADMIN-001', 'water_admin', hash, 'Water Administrator', 'water.admin@suvidha.gov.in', '9876543210', 'super_admin', 'Chief Engineer', 'active']
    );
    console.log('  ✓ Water admin created');
    console.log('    Username: water_admin');

    console.log('\n  Password for all: admin123');
    console.log('\n✅ All admin credentials seeded.\n');
  } catch (error) {
    console.error('\n❌ Error:', error.message, '\n');
    process.exit(1);
  } finally {
    if (connection) await connection.end();
    process.exit(0);
  }
}

seedAdmins();
