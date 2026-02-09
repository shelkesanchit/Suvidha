/**
 * Clean All Data from Database
 * Deletes all rows from every table but keeps the table structures intact.
 * 
 * Usage: node scripts/clean-data.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mysql = require('mysql2/promise');

async function cleanData() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'suvidha_db',
      port: process.env.DB_PORT || 3306,
    });

    console.log('\n🧹 SUVIDHA DATABASE - CLEAN ALL DATA');
    console.log('====================================\n');
    console.log('⚠️  This will DELETE all data from every table.\n');

    // Disable foreign key checks so we can truncate in any order
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    const [tables] = await connection.query('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);

    for (const table of tableNames) {
      const [countResult] = await connection.query(`SELECT COUNT(*) AS cnt FROM \`${table}\``);
      const rowCount = countResult[0].cnt;
      await connection.query(`TRUNCATE TABLE \`${table}\``);
      console.log(`  ✓ ${table} — ${rowCount} rows deleted`);
    }

    // Re-enable foreign key checks
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log(`\n✅ Done! Cleaned ${tableNames.length} tables.\n`);
  } catch (error) {
    console.error('\n❌ Error:', error.message, '\n');
    process.exit(1);
  } finally {
    if (connection) await connection.end();
    process.exit(0);
  }
}

cleanData();
