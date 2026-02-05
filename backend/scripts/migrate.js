const mysql = require('mysql2/promise');
require('dotenv').config();

const migrations = [
  // Users table
  `CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('customer', 'admin', 'staff') DEFAULT 'customer',
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // Consumer Accounts table
  `CREATE TABLE IF NOT EXISTS consumer_accounts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    consumer_number VARCHAR(50) UNIQUE NOT NULL,
    category ENUM('residential', 'commercial', 'industrial', 'agricultural') NOT NULL,
    tariff_type VARCHAR(50) NOT NULL,
    sanctioned_load DECIMAL(10,2) NOT NULL,
    meter_number VARCHAR(50),
    connection_status ENUM('active', 'disconnected', 'suspended') DEFAULT 'active',
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_consumer_number (consumer_number),
    INDEX idx_category (category)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // Applications table
  `CREATE TABLE IF NOT EXISTS applications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    application_number VARCHAR(50) UNIQUE NOT NULL,
    user_id INT,
    application_type ENUM(
      'new_connection',
      'change_of_load',
      'change_of_name',
      'address_correction',
      'reconnection',
      'category_change',
      'solar_rooftop',
      'ev_charging',
      'prepaid_recharge',
      'meter_reading'
    ) NOT NULL,
    status ENUM('submitted', 'document_verification', 'site_inspection', 'approval_pending', 'approved', 'rejected', 'work_in_progress', 'completed') DEFAULT 'submitted',
    application_data JSON NOT NULL,
    documents JSON,
    remarks TEXT,
    current_stage VARCHAR(100) DEFAULT 'Application Submitted',
    stage_history JSON,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_by INT,
    reviewed_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_application_number (application_number),
    INDEX idx_status (status),
    INDEX idx_type (application_type)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // Bills table
  `CREATE TABLE IF NOT EXISTS bills (
    id INT PRIMARY KEY AUTO_INCREMENT,
    bill_number VARCHAR(50) UNIQUE NOT NULL,
    consumer_account_id INT NOT NULL,
    billing_month VARCHAR(7) NOT NULL,
    units_consumed DECIMAL(10,2) NOT NULL,
    previous_reading DECIMAL(10,2),
    current_reading DECIMAL(10,2),
    energy_charges DECIMAL(10,2) NOT NULL,
    fixed_charges DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    subsidy_amount DECIMAL(10,2) DEFAULT 0,
    late_fee DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    due_date DATE NOT NULL,
    status ENUM('unpaid', 'paid', 'overdue', 'partial') DEFAULT 'unpaid',
    payment_date TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (consumer_account_id) REFERENCES consumer_accounts(id) ON DELETE CASCADE,
    INDEX idx_bill_number (bill_number),
    INDEX idx_consumer (consumer_account_id),
    INDEX idx_status (status),
    INDEX idx_billing_month (billing_month)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // Payments table
  `CREATE TABLE IF NOT EXISTS payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    transaction_id VARCHAR(100) UNIQUE NOT NULL,
    bill_id INT,
    consumer_account_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method ENUM('upi', 'card', 'netbanking', 'cash', 'prepaid') NOT NULL,
    payment_status ENUM('pending', 'success', 'failed', 'refunded') DEFAULT 'pending',
    razorpay_order_id VARCHAR(100),
    razorpay_payment_id VARCHAR(100),
    razorpay_signature VARCHAR(255),
    receipt_number VARCHAR(50),
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    remarks TEXT,
    FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE SET NULL,
    FOREIGN KEY (consumer_account_id) REFERENCES consumer_accounts(id) ON DELETE CASCADE,
    INDEX idx_transaction (transaction_id),
    INDEX idx_consumer (consumer_account_id),
    INDEX idx_status (payment_status)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // Complaints table
  `CREATE TABLE IF NOT EXISTS complaints (
    id INT PRIMARY KEY AUTO_INCREMENT,
    complaint_number VARCHAR(50) UNIQUE NOT NULL,
    consumer_account_id INT,
    user_id INT,
    complaint_type ENUM(
      'power_outage',
      'voltage_fluctuation',
      'meter_fault',
      'billing_dispute',
      'service_quality',
      'other'
    ) NOT NULL,
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    description TEXT NOT NULL,
    location TEXT,
    status ENUM('open', 'assigned', 'in_progress', 'resolved', 'closed') DEFAULT 'open',
    assigned_to INT,
    resolution_notes TEXT,
    stage_history JSON,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    FOREIGN KEY (consumer_account_id) REFERENCES consumer_accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_complaint_number (complaint_number),
    INDEX idx_status (status),
    INDEX idx_priority (priority)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // Meter Readings table
  `CREATE TABLE IF NOT EXISTS meter_readings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    consumer_account_id INT NOT NULL,
    reading_date DATE NOT NULL,
    reading_value DECIMAL(10,2) NOT NULL,
    reading_type ENUM('self', 'official', 'estimated') NOT NULL,
    submitted_by INT,
    photo_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (consumer_account_id) REFERENCES consumer_accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_consumer (consumer_account_id),
    INDEX idx_date (reading_date)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // Prepaid Recharges table
  `CREATE TABLE IF NOT EXISTS prepaid_recharges (
    id INT PRIMARY KEY AUTO_INCREMENT,
    recharge_number VARCHAR(50) UNIQUE NOT NULL,
    consumer_account_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    units_credited DECIMAL(10,2) NOT NULL,
    transaction_id VARCHAR(100) NOT NULL,
    status ENUM('pending', 'success', 'failed') DEFAULT 'pending',
    recharged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (consumer_account_id) REFERENCES consumer_accounts(id) ON DELETE CASCADE,
    INDEX idx_recharge_number (recharge_number),
    INDEX idx_consumer (consumer_account_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // Notifications table
  `CREATE TABLE IF NOT EXISTS notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'warning', 'success', 'error') DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_read (is_read)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // Audit Log table
  `CREATE TABLE IF NOT EXISTS audit_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INT,
    details JSON,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_created (created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // System Settings table
  `CREATE TABLE IF NOT EXISTS system_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_by INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // New Connection Applications table - Detailed structure
  `CREATE TABLE IF NOT EXISTS new_connection_applications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    application_id INT NOT NULL,
    
    -- Applicant Details
    full_name VARCHAR(255) NOT NULL,
    father_husband_name VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    gender ENUM('male', 'female', 'other') NOT NULL,
    identity_type ENUM('aadhar', 'pan', 'passport', 'voter_id', 'driving_license') NOT NULL,
    identity_number VARCHAR(50) NOT NULL,
    pan_number VARCHAR(10),
    email VARCHAR(255) NOT NULL,
    mobile VARCHAR(15) NOT NULL,
    alternate_mobile VARCHAR(15),
    
    -- Premises Information
    premises_address TEXT NOT NULL,
    landmark VARCHAR(255),
    plot_number VARCHAR(100) NOT NULL,
    khata_number VARCHAR(100),
    district VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    ownership_type ENUM('owned', 'rented', 'leased') NOT NULL,
    
    -- Connection Details
    category VARCHAR(50) NOT NULL,
    load_type ENUM('single_phase', 'three_phase') NOT NULL,
    required_load DECIMAL(10,2) NOT NULL,
    purpose TEXT NOT NULL,
    existing_consumer_number VARCHAR(50),
    
    -- Supply Details
    supply_voltage VARCHAR(10) NOT NULL,
    phases VARCHAR(5) NOT NULL,
    connected_load DECIMAL(10,2),
    number_of_floors INT NOT NULL,
    built_up_area DECIMAL(10,2) NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    INDEX idx_mobile (mobile),
    INDEX idx_identity (identity_type, identity_number),
    INDEX idx_category (category),
    INDEX idx_pincode (pincode)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
];

async function migrate() {
  let connection;
  try {
    console.log('🔄 Starting database migration...\n');

    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: process.env.DB_PORT || 3306
    });

    // Create database if not exists
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'suvidha_electricity'}`);
    console.log('✓ Database created/verified');

    // Use database
    await connection.query(`USE ${process.env.DB_NAME || 'suvidha_electricity'}`);

    // Run migrations
    for (let i = 0; i < migrations.length; i++) {
      await connection.query(migrations[i]);
      console.log(`✓ Migration ${i + 1}/${migrations.length} completed`);
    }

    console.log('\n✅ All migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

migrate();
