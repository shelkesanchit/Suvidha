/**
 * Water Department Migration Script
 * Run this to create all water-related tables in the database
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mysql = require('mysql2/promise');

const waterTables = [
  // 1. Water Consumers Table
  `CREATE TABLE IF NOT EXISTS water_consumers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    consumer_number VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    father_spouse_name VARCHAR(255),
    email VARCHAR(255),
    mobile VARCHAR(15) NOT NULL,
    alternate_mobile VARCHAR(15),
    aadhaar_number VARCHAR(12),
    property_id VARCHAR(100),
    house_flat_no VARCHAR(50),
    building_name VARCHAR(255),
    ward VARCHAR(20),
    address TEXT NOT NULL,
    landmark VARCHAR(255),
    city VARCHAR(100) DEFAULT 'Nashik',
    district VARCHAR(100) DEFAULT 'Nashik',
    state VARCHAR(100) DEFAULT 'Maharashtra',
    pincode VARCHAR(10),
    connection_type ENUM('permanent', 'temporary') DEFAULT 'permanent',
    connection_status ENUM('active', 'inactive', 'disconnected', 'pending') DEFAULT 'active',
    property_type ENUM('residential', 'commercial', 'industrial', 'institutional', 'construction') DEFAULT 'residential',
    ownership_status ENUM('owner', 'tenant', 'leaseholder') DEFAULT 'owner',
    pipe_size ENUM('15mm', '20mm', '25mm', '40mm', '50mm') DEFAULT '15mm',
    meter_number VARCHAR(50),
    meter_type ENUM('mechanical', 'digital', 'smart') DEFAULT 'mechanical',
    tariff_category VARCHAR(50) DEFAULT 'domestic',
    billing_cycle ENUM('monthly', 'bi-monthly', 'quarterly') DEFAULT 'monthly',
    outstanding_amount DECIMAL(12,2) DEFAULT 0,
    last_payment_date DATE,
    last_payment_amount DECIMAL(12,2),
    connection_date DATE,
    last_meter_reading_date DATE,
    last_meter_reading INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_consumer_number (consumer_number),
    INDEX idx_mobile (mobile),
    INDEX idx_ward (ward),
    INDEX idx_status (connection_status)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // 2. Water Applications Table
  `CREATE TABLE IF NOT EXISTS water_applications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    application_number VARCHAR(50) UNIQUE NOT NULL,
    application_type ENUM('new_connection', 'reconnection', 'disconnection', 'transfer', 'pipe_size_change', 'meter_change') NOT NULL,
    applicant_category ENUM('individual', 'housing_society', 'firm', 'private_company', 'trust', 'government') DEFAULT 'individual',
    full_name VARCHAR(255) NOT NULL,
    father_spouse_name VARCHAR(255),
    aadhaar_number VARCHAR(12),
    mobile VARCHAR(15) NOT NULL,
    email VARCHAR(255),
    property_id VARCHAR(100),
    house_flat_no VARCHAR(50),
    building_name VARCHAR(255),
    ward VARCHAR(20),
    address TEXT NOT NULL,
    landmark VARCHAR(255),
    property_type ENUM('residential', 'commercial', 'industrial', 'institutional', 'construction') DEFAULT 'residential',
    ownership_status ENUM('owner', 'tenant', 'leaseholder') DEFAULT 'owner',
    connection_purpose ENUM('drinking', 'construction', 'gardening', 'industrial') DEFAULT 'drinking',
    pipe_size_requested ENUM('15mm', '20mm', '25mm', '40mm', '50mm') DEFAULT '15mm',
    connection_type_requested ENUM('permanent', 'temporary') DEFAULT 'permanent',
    status ENUM('submitted', 'document_verification', 'site_inspection', 'approval_pending', 'approved', 'rejected', 'work_in_progress', 'completed') DEFAULT 'submitted',
    current_stage VARCHAR(100) DEFAULT 'Application Submitted',
    stage_history JSON,
    documents JSON,
    application_fee DECIMAL(10,2) DEFAULT 0,
    connection_fee DECIMAL(10,2) DEFAULT 0,
    security_deposit DECIMAL(10,2) DEFAULT 0,
    total_fee DECIMAL(10,2) DEFAULT 0,
    fee_paid BOOLEAN DEFAULT FALSE,
    payment_date DATE,
    payment_reference VARCHAR(100),
    assigned_to INT,
    assigned_engineer VARCHAR(255),
    remarks TEXT,
    rejection_reason TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_app_number (application_number),
    INDEX idx_status (status),
    INDEX idx_mobile (mobile),
    INDEX idx_submitted_at (submitted_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // 3. Water Complaints Table
  `CREATE TABLE IF NOT EXISTS water_complaints (
    id INT PRIMARY KEY AUTO_INCREMENT,
    complaint_number VARCHAR(50) UNIQUE NOT NULL,
    consumer_number VARCHAR(50),
    consumer_id INT,
    contact_name VARCHAR(255) NOT NULL,
    mobile VARCHAR(15) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    ward VARCHAR(20),
    landmark VARCHAR(255),
    location_coordinates VARCHAR(100),
    complaint_category ENUM('no-water', 'low-pressure', 'contaminated', 'pipeline-leak', 'meter-stopped', 'high-bill', 'illegal-connection', 'sewerage', 'other') NOT NULL,
    description TEXT NOT NULL,
    urgency ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    status ENUM('open', 'assigned', 'in_progress', 'resolved', 'closed', 'reopened') DEFAULT 'open',
    priority INT DEFAULT 5,
    assigned_to INT,
    assigned_engineer VARCHAR(255),
    assignment_date TIMESTAMP NULL,
    resolution_notes TEXT,
    resolved_at TIMESTAMP NULL,
    closed_at TIMESTAMP NULL,
    resolution_time_hours INT,
    customer_feedback TEXT,
    rating INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_complaint_number (complaint_number),
    INDEX idx_consumer_number (consumer_number),
    INDEX idx_status (status),
    INDEX idx_category (complaint_category),
    INDEX idx_created_at (created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // 4. Water Bills Table
  `CREATE TABLE IF NOT EXISTS water_bills (
    id INT PRIMARY KEY AUTO_INCREMENT,
    bill_number VARCHAR(50) UNIQUE NOT NULL,
    consumer_id INT NOT NULL,
    consumer_number VARCHAR(50) NOT NULL,
    bill_month VARCHAR(20) NOT NULL,
    bill_year INT NOT NULL,
    bill_date DATE NOT NULL,
    due_date DATE NOT NULL,
    meter_number VARCHAR(50),
    previous_reading INT DEFAULT 0,
    current_reading INT DEFAULT 0,
    consumption_kl DECIMAL(10,2) DEFAULT 0,
    reading_date DATE,
    water_charges DECIMAL(10,2) DEFAULT 0,
    sewerage_charges DECIMAL(10,2) DEFAULT 0,
    service_tax DECIMAL(10,2) DEFAULT 0,
    meter_rent DECIMAL(10,2) DEFAULT 0,
    other_charges DECIMAL(10,2) DEFAULT 0,
    arrears DECIMAL(10,2) DEFAULT 0,
    late_fee DECIMAL(10,2) DEFAULT 0,
    gross_amount DECIMAL(12,2) DEFAULT 0,
    discount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL,
    amount_paid DECIMAL(12,2) DEFAULT 0,
    balance_amount DECIMAL(12,2) DEFAULT 0,
    status ENUM('generated', 'sent', 'paid', 'partially_paid', 'overdue', 'disputed') DEFAULT 'generated',
    payment_status ENUM('unpaid', 'paid', 'partial') DEFAULT 'unpaid',
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP NULL,
    paid_at TIMESTAMP NULL,
    INDEX idx_bill_number (bill_number),
    INDEX idx_consumer_id (consumer_id),
    INDEX idx_consumer_number (consumer_number),
    INDEX idx_bill_month (bill_month, bill_year),
    INDEX idx_status (status),
    INDEX idx_due_date (due_date)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // 5. Water Payments Table
  `CREATE TABLE IF NOT EXISTS water_payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    transaction_id VARCHAR(100) UNIQUE NOT NULL,
    consumer_id INT,
    consumer_number VARCHAR(50) NOT NULL,
    bill_id INT,
    bill_number VARCHAR(50),
    amount DECIMAL(12,2) NOT NULL,
    payment_method ENUM('upi', 'card', 'netbanking', 'cash', 'cheque', 'wallet', 'pos') NOT NULL,
    payment_gateway VARCHAR(50),
    gateway_reference VARCHAR(100),
    status ENUM('initiated', 'processing', 'success', 'failed', 'refunded') DEFAULT 'initiated',
    receipt_number VARCHAR(50),
    receipt_generated BOOLEAN DEFAULT FALSE,
    ip_address VARCHAR(45),
    device_info VARCHAR(255),
    initiated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    INDEX idx_transaction_id (transaction_id),
    INDEX idx_consumer_id (consumer_id),
    INDEX idx_consumer_number (consumer_number),
    INDEX idx_status (status),
    INDEX idx_initiated_at (initiated_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // 6. Water Tariffs Table
  `CREATE TABLE IF NOT EXISTS water_tariffs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    category VARCHAR(50) NOT NULL,
    category_name VARCHAR(100) NOT NULL,
    property_type ENUM('residential', 'commercial', 'industrial', 'institutional') NOT NULL,
    slab_1_limit INT DEFAULT 10,
    slab_1_rate DECIMAL(10,2) NOT NULL,
    slab_2_limit INT DEFAULT 20,
    slab_2_rate DECIMAL(10,2) NOT NULL,
    slab_3_limit INT DEFAULT 30,
    slab_3_rate DECIMAL(10,2) NOT NULL,
    slab_4_rate DECIMAL(10,2) NOT NULL,
    minimum_charge DECIMAL(10,2) DEFAULT 0,
    meter_rent DECIMAL(10,2) DEFAULT 0,
    service_charge DECIMAL(10,2) DEFAULT 0,
    sewerage_percentage DECIMAL(5,2) DEFAULT 20,
    is_active BOOLEAN DEFAULT TRUE,
    effective_from DATE NOT NULL,
    effective_to DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_property_type (property_type)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // 7. Water Admin Users Table
  `CREATE TABLE IF NOT EXISTS water_admin_users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    mobile VARCHAR(15),
    role ENUM('super_admin', 'admin', 'manager', 'engineer', 'billing_officer', 'field_staff', 'viewer') NOT NULL DEFAULT 'viewer',
    department VARCHAR(100) DEFAULT 'Water Supply',
    designation VARCHAR(100),
    ward_assigned VARCHAR(50),
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_status (status)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // 8. Water Settings Table
  `CREATE TABLE IF NOT EXISTS water_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description VARCHAR(500),
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
];

async function runMigration() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'suvidha',
      port: process.env.DB_PORT || 3306
    });

    console.log('\n🌊 WATER DEPARTMENT DATABASE MIGRATION');
    console.log('=====================================\n');

    for (let i = 0; i < waterTables.length; i++) {
      const tableName = waterTables[i].match(/CREATE TABLE IF NOT EXISTS (\w+)/)[1];
      console.log(`Creating table: ${tableName}...`);
      await connection.query(waterTables[i]);
      console.log(`  ✓ ${tableName} created successfully`);
    }

    console.log('\n✅ All water tables created successfully!\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('Check your database credentials in .env file');
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runMigration();
