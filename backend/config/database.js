const { Pool } = require('pg');
require('dotenv').config();

// Create PostgreSQL connection pool (Supabase)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

// Test connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to Supabase database:', err.message);
  } else {
    console.log('✓ Supabase database connected successfully');
    release();
  }
});

module.exports = { pool };
