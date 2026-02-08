const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

/**
 * Creates the SUVIDHA database if it doesn't exist
 */

async function createDatabase() {
  let connection;
  try {
    console.log('🔧 Creating SUVIDHA database...\n');

    // Connect without specifying database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: process.env.DB_PORT || 3306
    });

    const dbName = process.env.DB_NAME || 'suvidha_db';

    // Create database if it doesn't exist
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );

    console.log(`✅ Database '${dbName}' is ready!\n`);
    
  } catch (error) {
    console.error('❌ Database creation failed:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createDatabase()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
