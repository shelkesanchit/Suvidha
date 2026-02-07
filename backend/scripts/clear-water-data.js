/**
 * Clear Water Department Data Script
 * Run this to DELETE all data from water-related tables (keeps table structure)
 * 
 * Usage: node scripts/clear-water-data.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mysql = require('mysql2/promise');

const tablesToClear = [
  'water_payments',      // Clear first (has foreign key references)
  'water_bills',         // Clear second
  'water_complaints',    // Clear complaints
  'water_applications',  // Clear applications
  'water_consumers',     // Clear consumers last
  // 'water_admin_users' - NOT clearing admin users, keep login credentials
];

async function clearAllWaterData() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'suvidha',
      port: process.env.DB_PORT || 3306,
    });

    console.log('✓ Connected to database');
    console.log('\n========================================');
    console.log('  CLEARING ALL WATER DATA');
    console.log('========================================\n');

    // Disable foreign key checks temporarily
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');

    for (const table of tablesToClear) {
      try {
        // Get count before deletion
        const [countBefore] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
        const recordCount = countBefore[0].count;

        // Delete all records
        await connection.execute(`DELETE FROM ${table}`);
        
        // Reset auto-increment to 1
        await connection.execute(`ALTER TABLE ${table} AUTO_INCREMENT = 1`);

        console.log(`✓ Cleared ${table}: ${recordCount} records deleted`);
      } catch (err) {
        if (err.code === 'ER_NO_SUCH_TABLE') {
          console.log(`⚠ Table ${table} does not exist, skipping...`);
        } else {
          throw err;
        }
      }
    }

    // Re-enable foreign key checks
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');

    console.log('\n========================================');
    console.log('  ALL WATER DATA CLEARED SUCCESSFULLY!');
    console.log('========================================');
    console.log('\nNote: water_admin_users table was NOT cleared.');
    console.log('Admin login credentials are preserved.\n');

  } catch (error) {
    console.error('\n✗ Error clearing data:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed.');
    }
  }
}

// Run the function
clearAllWaterData();
