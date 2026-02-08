#!/usr/bin/env node

const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Database connection config
const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  multipleStatements: true,
});

console.log('\n╔════════════════════════════════════════════════╗');
console.log('║    SUVIDHA DATABASE SETUP - MySQL Schema      ║');
console.log('╚════════════════════════════════════════════════╝\n');

console.log('📊 Database Configuration:');
console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
console.log(`   Port: ${process.env.DB_PORT || 3306}`);
console.log(`   User: ${process.env.DB_USER || 'root'}`);
console.log(`   Database: ${process.env.DB_NAME || 'suvidha_db'}`);
console.log('');

// Read SQL schema file
const schemaPath = path.join(__dirname, '../../database/suvidha_complete_schema.sql');
console.log(`📄 Reading schema from: ${schemaPath}\n`);

let sql;
try {
  sql = fs.readFileSync(schemaPath, 'utf8');
} catch (err) {
  console.error('❌ Error reading schema file:', err.message);
  process.exit(1);
}

// Connect to MySQL
connection.connect((err) => {
  if (err) {
    console.error('❌ Connection failed:', err.message);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.error('   Database connection was closed.');
    }
    if (err.code === 'ER_CON_COUNT_ERROR') {
      console.error('   Database has too many connections.');
    }
    if (err.code === 'ECONNREFUSED') {
      console.error('   ⚠️  Cannot connect to MySQL. Is it running?');
      console.error('   Start MySQL first:');
      console.error('   Windows: net start MySQL80 (or your version)');
      console.error('   Mac: brew services start mysql');
      console.error('   Linux: sudo systemctl start mysql');
    }
    process.exit(1);
  }

  console.log('✅ Connected to MySQL\n');
  console.log('🔄 Creating database and tables...\n');

  // Execute schema
  connection.query(sql, (err, results) => {
    if (err) {
      console.error('❌ Schema execution failed:', err.message);
      console.error('\nError Details:', err);
      connection.end();
      process.exit(1);
    }

    console.log('✅ Schema created successfully!\n');
    console.log('📋 Actions completed:');
    console.log('   ✓ Created database: suvidha_db');
    console.log('   ✓ Created 10 tables:');
    console.log('     - customers');
    console.log('     - meter_readings');
    console.log('     - bills');
    console.log('     - payments');
    console.log('     - complaints');
    console.log('     - applications');
    console.log('     - admin_users');
    console.log('     - audit_logs');
    console.log('     - settings');
    console.log('     - tariff_rates');
    console.log('   ✓ Created 10+ indexes for performance');
    console.log('   ✓ Inserted default data:');
    console.log('     - 1 Admin user (admin@example.com / password123)');
    console.log('     - 4 Electricity tariff rates (MSEDCL)');
    console.log('     - 3 Water tariff rates (MIDC)');
    console.log('     - Default company settings\n');

    console.log('🎯 Next Steps:');
    console.log('   1. Start backend: cd backend && npm start');
    console.log('   2. Backend will auto-connect to database');
    console.log('   3. Check console: "✓ Database connected successfully"\n');

    console.log('📝 Login Credentials (Admin):');
    console.log('   Email: admin@example.com');
    console.log('   Password: password123\n');

    console.log('✅ DATABASE SETUP COMPLETE!\n');

    connection.end();
    process.exit(0);
  });
});
