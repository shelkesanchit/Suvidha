const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL_POOLER || process.env.DATABASE_URL;

// Create PostgreSQL connection pool (Supabase)
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

// Test connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to Supabase database:', err.message);
    if (err.code === 'ENOTFOUND') {
      console.error('Hint: this host currently resolves to IPv6-only on many networks.');
      console.error('Set DATABASE_URL_POOLER to your Supabase Session/Transaction Pooler URL (IPv4) and restart.');
    }
  } else {
    console.log('✓ Supabase database connected successfully');
    release();
  }
});

module.exports = { pool };
