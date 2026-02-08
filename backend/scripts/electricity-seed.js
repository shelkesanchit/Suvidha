const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function seed() {
  let connection;
  try {
    console.log('\n⚡ ELECTRICITY DEPARTMENT - DATABASE SEEDING');
    console.log('============================================\n');

    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'suvidha',
      port: process.env.DB_PORT || 3306
    });

    // Hash password
    const adminPassword = await bcrypt.hash('Admin@123', 10);

    // Insert admin user
    await connection.query(`
      INSERT INTO electricity_users (email, password, role, full_name, phone) 
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE email=email
    `, ['admin@electricity.gov.in', adminPassword, 'admin', 'System Administrator', '9876543210']);
    console.log('✓ Admin user created (admin@electricity.gov.in / Admin@123)');

    // Insert system settings
    const settings = [
      ['tariff_residential_upto_100', '5.50', 'Residential tariff for consumption up to 100 units (Rs/unit)'],
      ['tariff_residential_101_300', '7.00', 'Residential tariff for consumption 101-300 units (Rs/unit)'],
      ['tariff_residential_above_300', '8.50', 'Residential tariff for consumption above 300 units (Rs/unit)'],
      ['tariff_commercial', '9.00', 'Commercial tariff (Rs/unit)'],
      ['tariff_industrial', '7.50', 'Industrial tariff (Rs/unit)'],
      ['tariff_agricultural', '4.00', 'Agricultural tariff (Rs/unit)'],
      ['fixed_charge_residential', '50.00', 'Monthly fixed charge for residential connections'],
      ['fixed_charge_commercial', '200.00', 'Monthly fixed charge for commercial connections'],
      ['tax_rate', '5.0', 'Tax percentage on electricity bills'],
      ['late_fee_percentage', '2.0', 'Late payment fee percentage per month'],
      ['new_connection_fee_residential', '1500.00', 'New residential connection fee'],
      ['new_connection_fee_commercial', '5000.00', 'New commercial connection fee'],
      ['reconnection_fee', '500.00', 'Reconnection fee after disconnection'],
      ['kiosk_language', 'en', 'Default kiosk language'],
      ['support_phone', '1912', 'Customer support phone number'],
      ['support_email', 'support@electricity.gov.in', 'Customer support email']
    ];

    for (const [key, value, description] of settings) {
      await connection.query(`
        INSERT INTO electricity_system_settings (setting_key, setting_value, description)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value)
      `, [key, value, description]);
    }
    console.log('✓ System settings created');

    console.log('\n✅ Electricity seeding completed successfully!');
    console.log('\n📝 Login Credentials:');
    console.log('\n🔐 ELECTRICITY ADMIN LOGIN:');
    console.log('  Email: admin@electricity.gov.in');
    console.log('  Password: Admin@123');
    console.log('  Admin Panel URL: http://localhost:5174/electricity/login\n');

  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

seed();
