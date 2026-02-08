const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * Electricity Department Database Migration
 * Creates all tables for electricity billing and management
 */

const migrations = [
  // Users table
  `CREATE TABLE IF NOT EXISTS electricity_users (
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
  `CREATE TABLE IF NOT EXISTS electricity_consumer_accounts (
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
    FOREIGN KEY (user_id) REFERENCES electricity_users(id) ON DELETE CASCADE,
    INDEX idx_consumer_number (consumer_number),
    INDEX idx_category (category)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // Applications table
  `CREATE TABLE IF NOT EXISTS electricity_applications (
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
    FOREIGN KEY (user_id) REFERENCES electricity_users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES electricity_users(id) ON DELETE SET NULL,
    INDEX idx_application_number (application_number),
    INDEX idx_status (status),
    INDEX idx_type (application_type)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // Bills table
  `CREATE TABLE IF NOT EXISTS electricity_bills (
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
    FOREIGN KEY (consumer_account_id) REFERENCES electricity_consumer_accounts(id) ON DELETE CASCADE,
    INDEX idx_bill_number (bill_number),
    INDEX idx_consumer (consumer_account_id),
    INDEX idx_status (status),
    INDEX idx_billing_month (billing_month)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // Payments table
  `CREATE TABLE IF NOT EXISTS electricity_payments (
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
    FOREIGN KEY (bill_id) REFERENCES electricity_bills(id) ON DELETE SET NULL,
    FOREIGN KEY (consumer_account_id) REFERENCES electricity_consumer_accounts(id) ON DELETE CASCADE,
    INDEX idx_transaction (transaction_id),
    INDEX idx_consumer (consumer_account_id),
    INDEX idx_status (payment_status)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // Complaints table
  `CREATE TABLE IF NOT EXISTS electricity_complaints (
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
    FOREIGN KEY (consumer_account_id) REFERENCES electricity_consumer_accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES electricity_users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES electricity_users(id) ON DELETE SET NULL,
    INDEX idx_complaint_number (complaint_number),
    INDEX idx_status (status),
    INDEX idx_priority (priority)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // Meter Readings table
  `CREATE TABLE IF NOT EXISTS electricity_meter_readings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    consumer_account_id INT NOT NULL,
    reading_date DATE NOT NULL,
    reading_value DECIMAL(10,2) NOT NULL,
    reading_type ENUM('self', 'official', 'estimated') NOT NULL,
    submitted_by INT,
    photo_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (consumer_account_id) REFERENCES electricity_consumer_accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (submitted_by) REFERENCES electricity_users(id) ON DELETE SET NULL,
    INDEX idx_consumer (consumer_account_id),
    INDEX idx_date (reading_date)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // Prepaid Recharges table
  `CREATE TABLE IF NOT EXISTS electricity_prepaid_recharges (
    id INT PRIMARY KEY AUTO_INCREMENT,
    recharge_number VARCHAR(50) UNIQUE NOT NULL,
    consumer_account_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    units_credited DECIMAL(10,2) NOT NULL,
    transaction_id VARCHAR(100) NOT NULL,
    status ENUM('pending', 'success', 'failed') DEFAULT 'pending',
    recharged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (consumer_account_id) REFERENCES electricity_consumer_accounts(id) ON DELETE CASCADE,
    INDEX idx_recharge_number (recharge_number),
    INDEX idx_consumer (consumer_account_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // Notifications table
  `CREATE TABLE IF NOT EXISTS electricity_notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'warning', 'success', 'error') DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES electricity_users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_read (is_read)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // Audit Log table
  `CREATE TABLE IF NOT EXISTS electricity_audit_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INT,
    details JSON,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES electricity_users(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_created (created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // System Settings table
  `CREATE TABLE IF NOT EXISTS electricity_system_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_by INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES electricity_users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // New Connection Applications table - Detailed structure
  `CREATE TABLE IF NOT EXISTS electricity_new_connection_applications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    application_id INT NOT NULL,
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
    premises_address TEXT NOT NULL,
    landmark VARCHAR(255),
    plot_number VARCHAR(100) NOT NULL,
    khata_number VARCHAR(100),
    district VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    ownership_type ENUM('owned', 'rented', 'leased') NOT NULL,
    category VARCHAR(50) NOT NULL,
    load_type ENUM('single_phase', 'three_phase') NOT NULL,
    required_load DECIMAL(10,2) NOT NULL,
    purpose TEXT NOT NULL,
    existing_consumer_number VARCHAR(50),
    supply_voltage VARCHAR(10) NOT NULL,
    phases VARCHAR(5) NOT NULL,
    connected_load DECIMAL(10,2),
    number_of_floors INT NOT NULL,
    built_up_area DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES electricity_applications(id) ON DELETE CASCADE,
    INDEX idx_mobile (mobile),
    INDEX idx_identity (identity_type, identity_number),
    INDEX idx_category (category),
    INDEX idx_pincode (pincode)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // ============================================================
  // GAS DISTRIBUTION TABLES
  // ============================================================

  // Gas Consumers table
  `CREATE TABLE IF NOT EXISTS gas_consumers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    consumer_number VARCHAR(50) UNIQUE NOT NULL COMMENT 'Format: GC + Year + Sequence',
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
    gas_type ENUM('png', 'lpg') DEFAULT 'png' COMMENT 'PNG = Piped Natural Gas, LPG = Liquified Petroleum Gas',
    connection_type ENUM('permanent', 'temporary') DEFAULT 'permanent',
    connection_status ENUM('active', 'inactive', 'disconnected', 'pending') DEFAULT 'active',
    property_type ENUM('domestic', 'commercial', 'industrial', 'institutional') DEFAULT 'domestic',
    ownership_status ENUM('owner', 'tenant', 'leaseholder') DEFAULT 'owner',
    meter_number VARCHAR(50),
    meter_type ENUM('mechanical', 'digital', 'smart', 'prepaid') DEFAULT 'digital',
    tariff_category VARCHAR(50) DEFAULT 'domestic',
    billing_cycle ENUM('monthly', 'bi-monthly', 'quarterly') DEFAULT 'monthly',
    outstanding_amount DECIMAL(12,2) DEFAULT 0,
    last_payment_date DATE,
    last_payment_amount DECIMAL(12,2),
    connection_date DATE,
    last_meter_reading_date DATE,
    last_meter_reading DECIMAL(10,2) DEFAULT 0 COMMENT 'In SCM (Standard Cubic Meters)',
    lpg_distributor VARCHAR(100),
    lpg_consumer_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_consumer_number (consumer_number),
    INDEX idx_mobile (mobile),
    INDEX idx_ward (ward),
    INDEX idx_gas_type (gas_type),
    INDEX idx_status (connection_status)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Gas distribution consumers'`,

  // Gas Applications table
  `CREATE TABLE IF NOT EXISTS gas_applications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    application_number VARCHAR(50) UNIQUE NOT NULL COMMENT 'Format: GNC/GRC/GCB + Year + Sequence',
    application_type ENUM('new_connection', 'reconnection', 'disconnection', 'transfer', 'cylinder_booking', 'conversion', 'meter_change') NOT NULL,
    applicant_category ENUM('individual', 'housing_society', 'firm', 'private_company', 'trust', 'government') DEFAULT 'individual',
    gas_type ENUM('png', 'lpg') DEFAULT 'png',
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
    property_type ENUM('domestic', 'commercial', 'industrial', 'institutional') DEFAULT 'domestic',
    ownership_status ENUM('owner', 'tenant', 'leaseholder') DEFAULT 'owner',
    connection_purpose ENUM('cooking', 'heating', 'industrial', 'commercial', 'power_generation') DEFAULT 'cooking',
    pipeline_distance DECIMAL(10,2) COMMENT 'Distance from main pipeline in meters',
    cylinder_type ENUM('domestic_14.2kg', 'domestic_5kg', 'commercial_19kg', 'commercial_47.5kg') DEFAULT 'domestic_14.2kg',
    status ENUM('submitted', 'document_verification', 'site_inspection', 'approval_pending', 'approved', 'rejected', 'work_in_progress', 'completed') DEFAULT 'submitted',
    current_stage VARCHAR(100) DEFAULT 'Application Submitted',
    stage_history JSON COMMENT 'JSON array of stage transitions with timestamps',
    documents JSON COMMENT 'JSON array of uploaded document references',
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
    INDEX idx_gas_type (gas_type),
    INDEX idx_submitted_at (submitted_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Gas connection applications'`,

  // Gas Complaints table
  `CREATE TABLE IF NOT EXISTS gas_complaints (
    id INT PRIMARY KEY AUTO_INCREMENT,
    complaint_number VARCHAR(50) UNIQUE NOT NULL COMMENT 'Format: GCP/GLEAK + Year + Sequence',
    consumer_number VARCHAR(50),
    consumer_id INT,
    contact_name VARCHAR(255) NOT NULL,
    mobile VARCHAR(15) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    ward VARCHAR(20),
    landmark VARCHAR(255),
    location_coordinates VARCHAR(100),
    complaint_category ENUM('gas-leak', 'no-supply', 'low-pressure', 'meter-issue', 'billing-dispute', 'cylinder-delivery', 'equipment-malfunction', 'safety-concern', 'other') NOT NULL,
    description TEXT NOT NULL,
    urgency ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    status ENUM('open', 'assigned', 'in_progress', 'resolved', 'closed', 'reopened') DEFAULT 'open',
    priority INT DEFAULT 5 COMMENT '1=Highest (Gas Leak), 10=Lowest',
    assigned_to INT,
    assigned_engineer VARCHAR(255),
    assignment_date TIMESTAMP NULL,
    resolution_notes TEXT,
    resolved_at TIMESTAMP NULL,
    closed_at TIMESTAMP NULL,
    resolution_time_hours INT,
    customer_feedback TEXT,
    rating INT COMMENT '1-5 star rating',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_complaint_number (complaint_number),
    INDEX idx_consumer_number (consumer_number),
    INDEX idx_status (status),
    INDEX idx_category (complaint_category),
    INDEX idx_priority (priority),
    INDEX idx_created_at (created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Gas distribution complaints'`,

  // Gas Bills table
  `CREATE TABLE IF NOT EXISTS gas_bills (
    id INT PRIMARY KEY AUTO_INCREMENT,
    bill_number VARCHAR(50) UNIQUE NOT NULL COMMENT 'Format: GB + Year + Sequence',
    consumer_id INT NOT NULL,
    consumer_number VARCHAR(50) NOT NULL,
    bill_month VARCHAR(20) NOT NULL,
    bill_year INT NOT NULL,
    bill_date DATE NOT NULL,
    due_date DATE NOT NULL,
    meter_number VARCHAR(50),
    previous_reading DECIMAL(10,2) DEFAULT 0,
    current_reading DECIMAL(10,2) DEFAULT 0,
    consumption_scm DECIMAL(10,2) DEFAULT 0 COMMENT 'Consumption in Standard Cubic Meters',
    reading_date DATE,
    gas_charges DECIMAL(10,2) DEFAULT 0,
    pipeline_rent DECIMAL(10,2) DEFAULT 0,
    service_tax DECIMAL(10,2) DEFAULT 0,
    vat DECIMAL(10,2) DEFAULT 0,
    other_charges DECIMAL(10,2) DEFAULT 0,
    arrears DECIMAL(10,2) DEFAULT 0,
    late_fee DECIMAL(10,2) DEFAULT 0,
    gross_amount DECIMAL(12,2) DEFAULT 0,
    discount DECIMAL(10,2) DEFAULT 0,
    subsidy DECIMAL(10,2) DEFAULT 0,
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
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Gas billing records'`,

  // Gas Payments table
  `CREATE TABLE IF NOT EXISTS gas_payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    transaction_id VARCHAR(100) UNIQUE NOT NULL,
    consumer_id INT,
    consumer_number VARCHAR(50) NOT NULL,
    bill_id INT,
    bill_number VARCHAR(50),
    amount DECIMAL(12,2) NOT NULL,
    payment_method ENUM('upi', 'card', 'netbanking', 'cash', 'cheque', 'wallet', 'pos') NOT NULL,
    payment_type ENUM('bill_payment', 'cylinder_payment', 'connection_fee', 'security_deposit', 'other') DEFAULT 'bill_payment',
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
    INDEX idx_payment_type (payment_type),
    INDEX idx_initiated_at (initiated_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Gas payment transactions'`,

  // Gas Cylinder Bookings table
  `CREATE TABLE IF NOT EXISTS gas_cylinder_bookings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_number VARCHAR(50) UNIQUE NOT NULL,
    consumer_id INT NOT NULL,
    consumer_number VARCHAR(50) NOT NULL,
    cylinder_type ENUM('domestic_14.2kg', 'domestic_5kg', 'commercial_19kg', 'commercial_47.5kg') NOT NULL,
    quantity INT DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    delivery_preference ENUM('home_delivery', 'pickup') DEFAULT 'home_delivery',
    delivery_address TEXT,
    delivery_time_slot VARCHAR(50),
    status ENUM('booked', 'confirmed', 'dispatched', 'delivered', 'cancelled') DEFAULT 'booked',
    payment_status ENUM('pending', 'paid', 'refunded') DEFAULT 'pending',
    delivery_person VARCHAR(100),
    delivery_contact VARCHAR(15),
    otp VARCHAR(6),
    booked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP NULL,
    dispatched_at TIMESTAMP NULL,
    delivered_at TIMESTAMP NULL,
    paid_at TIMESTAMP NULL,
    cancelled_at TIMESTAMP NULL,
    cancellation_reason TEXT,
    INDEX idx_booking_number (booking_number),
    INDEX idx_consumer_id (consumer_id),
    INDEX idx_consumer_number (consumer_number),
    INDEX idx_status (status),
    INDEX idx_booked_at (booked_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='LPG cylinder booking records'`,

  // Gas Tariffs table
  `CREATE TABLE IF NOT EXISTS gas_tariffs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    category VARCHAR(50) NOT NULL,
    category_name VARCHAR(100) NOT NULL,
    gas_type ENUM('png', 'lpg') NOT NULL,
    property_type ENUM('domestic', 'commercial', 'industrial', 'institutional') NOT NULL,
    slab_1_limit DECIMAL(10,2) DEFAULT 10 COMMENT 'SCM limit for slab 1',
    slab_1_rate DECIMAL(10,2) NOT NULL COMMENT 'Rate per SCM for slab 1',
    slab_2_limit DECIMAL(10,2) DEFAULT 25,
    slab_2_rate DECIMAL(10,2) NOT NULL,
    slab_3_limit DECIMAL(10,2) DEFAULT 50,
    slab_3_rate DECIMAL(10,2) NOT NULL,
    slab_4_rate DECIMAL(10,2) NOT NULL COMMENT 'Rate for consumption above slab 3',
    minimum_charge DECIMAL(10,2) DEFAULT 0,
    pipeline_rent DECIMAL(10,2) DEFAULT 0,
    service_charge DECIMAL(10,2) DEFAULT 0,
    vat_percentage DECIMAL(5,2) DEFAULT 5 COMMENT 'VAT percentage',
    is_active BOOLEAN DEFAULT TRUE,
    effective_from DATE NOT NULL,
    effective_to DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_gas_type (gas_type),
    INDEX idx_property_type (property_type)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Gas tariff rate structure'`,

  // Gas Admin Users table
  `CREATE TABLE IF NOT EXISTS gas_admin_users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    mobile VARCHAR(15),
    role ENUM('super_admin', 'admin', 'manager', 'engineer', 'billing_officer', 'delivery_staff', 'viewer') NOT NULL DEFAULT 'viewer',
    department VARCHAR(100) DEFAULT 'Gas Distribution',
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
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Gas admin panel user accounts'`,

  // Gas Settings table
  `CREATE TABLE IF NOT EXISTS gas_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description VARCHAR(500),
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Gas system settings and configuration'`
];

async function migrate() {
  let connection;
  try {
    console.log('\n⚡ ELECTRICITY DEPARTMENT - DATABASE MIGRATION');
    console.log('================================================\n');

    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: process.env.DB_PORT || 3306
    });

    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'suvidha'}`);
    console.log('✓ Database created/verified');

    await connection.query(`USE ${process.env.DB_NAME || 'suvidha'}`);

    console.log('Creating electricity tables...\n');
    for (let i = 0; i < migrations.length; i++) {
      await connection.query(migrations[i]);
      console.log(`  ✓ Table ${i + 1}/${migrations.length} created`);
    }

    console.log('\n✅ Electricity migration completed successfully!');
    console.log(`📊 Created ${migrations.length} tables\n`);
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

migrate();
