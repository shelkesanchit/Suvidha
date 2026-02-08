const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * Gas/LPG Department Database Migration
 * Creates all tables for gas billing and cylinder management
 */

const migrations = [
  // Gas Consumers table
  `CREATE TABLE IF NOT EXISTS gas_consumers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    consumer_number VARCHAR(50) UNIQUE NOT NULL,
    user_id INT,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(15) NOT NULL,
    date_of_birth DATE,
    aadhar_number VARCHAR(12),
    pan_number VARCHAR(10),
    connection_type ENUM('PNG', 'LPG') NOT NULL,
    consumer_type ENUM('residential', 'commercial', 'industrial') NOT NULL,
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    landmark VARCHAR(255),
    connection_status ENUM('active', 'inactive', 'suspended', 'disconnected') DEFAULT 'active',
    connection_date DATE,
    security_deposit DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_consumer_number (consumer_number),
    INDEX idx_phone (phone),
    INDEX idx_connection_type (connection_type)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // Gas Applications table
  `CREATE TABLE IF NOT EXISTS gas_applications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    application_number VARCHAR(50) UNIQUE NOT NULL,
    consumer_id INT,
    application_type ENUM(
      'new_connection',
      'change_of_address',
      'change_of_name',
      'transfer',
      'surrender',
      'conversion',
      'additional_connection',
      'update_kyc'
    ) NOT NULL,
    connection_type ENUM('PNG', 'LPG') NOT NULL,
    status ENUM('pending', 'document_verification', 'approved', 'rejected', 'completed') DEFAULT 'pending',
    applicant_name VARCHAR(255) NOT NULL,
    applicant_phone VARCHAR(15) NOT NULL,
    applicant_email VARCHAR(255),
    application_data JSON NOT NULL,
    documents JSON,
    submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approval_date TIMESTAMP NULL,
    rejection_reason TEXT,
    remarks TEXT,
    reviewed_by INT,
    FOREIGN KEY (consumer_id) REFERENCES gas_consumers(id) ON DELETE SET NULL,
    INDEX idx_application_number (application_number),
    INDEX idx_status (status),
    INDEX idx_type (application_type)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // Gas Complaints table
  `CREATE TABLE IF NOT EXISTS gas_complaints (
    id INT PRIMARY KEY AUTO_INCREMENT,
    complaint_number VARCHAR(50) UNIQUE NOT NULL,
    consumer_id INT NOT NULL,
    complaint_type ENUM(
      'leakage',
      'billing_issue',
      'meter_problem',
      'pressure_issue',
      'delivery_delay',
      'service_quality',
      'installation',
      'other'
    ) NOT NULL,
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    description TEXT NOT NULL,
    location TEXT,
    status ENUM('open', 'assigned', 'in_progress', 'resolved', 'closed') DEFAULT 'open',
    assigned_to INT,
    resolution_notes TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    FOREIGN KEY (consumer_id) REFERENCES gas_consumers(id) ON DELETE CASCADE,
    INDEX idx_complaint_number (complaint_number),
    INDEX idx_status (status),
    INDEX idx_priority (priority)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // Gas Bills table
  `CREATE TABLE IF NOT EXISTS gas_bills (
    id INT PRIMARY KEY AUTO_INCREMENT,
    bill_number VARCHAR(50) UNIQUE NOT NULL,
    consumer_id INT NOT NULL,
    billing_month VARCHAR(7) NOT NULL,
    bill_type ENUM('PNG', 'LPG_CYLINDER', 'SECURITY_DEPOSIT') NOT NULL,
    consumption_units DECIMAL(10,2),
    previous_reading DECIMAL(10,2),
    current_reading DECIMAL(10,2),
    energy_charges DECIMAL(10,2) NOT NULL,
    fixed_charges DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    subsidy_amount DECIMAL(10,2) DEFAULT 0,
    late_fee DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    due_date DATE NOT NULL,
    status ENUM('unpaid', 'paid', 'overdue', 'partial') DEFAULT 'unpaid',
    payment_date TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (consumer_id) REFERENCES gas_consumers(id) ON DELETE CASCADE,
    INDEX idx_bill_number (bill_number),
    INDEX idx_consumer (consumer_id),
    INDEX idx_status (status)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // Gas Payments table
  `CREATE TABLE IF NOT EXISTS gas_payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    transaction_id VARCHAR(100) UNIQUE NOT NULL,
    bill_id INT,
    consumer_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method ENUM('upi', 'card', 'netbanking', 'cash', 'wallet') NOT NULL,
    payment_status ENUM('pending', 'success', 'failed', 'refunded') DEFAULT 'pending',
    razorpay_order_id VARCHAR(100),
    razorpay_payment_id VARCHAR(100),
    razorpay_signature VARCHAR(255),
    receipt_number VARCHAR(50),
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    remarks TEXT,
    FOREIGN KEY (bill_id) REFERENCES gas_bills(id) ON DELETE SET NULL,
    FOREIGN KEY (consumer_id) REFERENCES gas_consumers(id) ON DELETE CASCADE,
    INDEX idx_transaction (transaction_id),
    INDEX idx_consumer (consumer_id),
    INDEX idx_status (payment_status)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // Cylinder Bookings table (LPG specific)
  `CREATE TABLE IF NOT EXISTS gas_cylinder_bookings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_number VARCHAR(50) UNIQUE NOT NULL,
    consumer_id INT NOT NULL,
    cylinder_type ENUM('14.2kg', '5kg', '19kg') DEFAULT '14.2kg',
    quantity INT DEFAULT 1,
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivery_date DATE,
    delivery_time_slot VARCHAR(50),
    status ENUM('pending', 'confirmed', 'out_for_delivery', 'delivered', 'cancelled') DEFAULT 'pending',
    delivery_address TEXT NOT NULL,
    payment_status ENUM('pending', 'paid') DEFAULT 'pending',
    payment_method ENUM('cash_on_delivery', 'online') DEFAULT 'cash_on_delivery',
    amount DECIMAL(10,2) NOT NULL,
    remarks TEXT,
    FOREIGN KEY (consumer_id) REFERENCES gas_consumers(id) ON DELETE CASCADE,
    INDEX idx_booking_number (booking_number),
    INDEX idx_consumer (consumer_id),
    INDEX idx_status (status),
    INDEX idx_delivery_date (delivery_date)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // Gas Tariffs table
  `CREATE TABLE IF NOT EXISTS gas_tariffs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    connection_type ENUM('PNG', 'LPG') NOT NULL,
    consumer_type ENUM('residential', 'commercial', 'industrial') NOT NULL,
    cylinder_type VARCHAR(20),
    slab_from DECIMAL(10,2),
    slab_to DECIMAL(10,2),
    rate DECIMAL(10,2) NOT NULL,
    fixed_charge DECIMAL(10,2) DEFAULT 0,
    effective_from DATE NOT NULL,
    effective_to DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_active (is_active),
    INDEX idx_type (connection_type, consumer_type)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // Gas Admin Users table
  `CREATE TABLE IF NOT EXISTS gas_admin_users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(15),
    role ENUM('super_admin', 'admin', 'operator', 'field_staff') DEFAULT 'operator',
    department VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // Gas Settings table
  `CREATE TABLE IF NOT EXISTS gas_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    category VARCHAR(50),
    updated_by INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES gas_admin_users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
];

async function migrate() {
  let connection;
  try {
    console.log('\n🔥 GAS/LPG DEPARTMENT - DATABASE MIGRATION');
    console.log('==========================================\n');

    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: process.env.DB_PORT || 3306
    });

    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'suvidha'}`);
    console.log('✓ Database created/verified');

    await connection.query(`USE ${process.env.DB_NAME || 'suvidha'}`);

    console.log('Creating gas tables...\n');
    for (let i = 0; i < migrations.length; i++) {
      await connection.query(migrations[i]);
      console.log(`  ✓ Table ${i + 1}/${migrations.length} created`);
    }

    console.log('\n✅ Gas migration completed successfully!');
    console.log(`📊 Created ${migrations.length} tables\n`);
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

migrate();
