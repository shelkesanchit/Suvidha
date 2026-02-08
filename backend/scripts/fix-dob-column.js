require('dotenv').config();
const mysql = require('mysql2/promise');

async function fixDateOfBirthColumn() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'suvidha'
  });

  try {
    console.log('Updating date_of_birth column to allow NULL values...');
    
    await connection.query(`
      ALTER TABLE new_connection_applications 
      MODIFY COLUMN date_of_birth DATE NULL
    `);
    
    console.log('✓ Successfully updated date_of_birth column');
    console.log('Column can now accept NULL values');
  } catch (error) {
    console.error('Error updating column:', error.message);
  } finally {
    await connection.end();
  }
}

fixDateOfBirthColumn();
