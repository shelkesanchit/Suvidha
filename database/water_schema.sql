-- ============================================================
-- SUVIDHA WATER DEPARTMENT - COMPLETE DATABASE SCHEMA
-- ============================================================
-- Database: suvidha
-- Last Updated: February 2026
-- 
-- INSTRUCTIONS:
-- 1. Open MySQL Workbench or MySQL Command Line
-- 2. Run this entire script to create all tables
-- 3. Then run the seed data section if you want sample data
-- ============================================================

-- Create Database (if not exists)
CREATE DATABASE IF NOT EXISTS suvidha 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Use the database
USE suvidha;

-- ============================================================
-- TABLE 1: WATER CONSUMERS
-- Stores all registered water consumers/customers
-- ============================================================
DROP TABLE IF EXISTS water_consumers;
CREATE TABLE water_consumers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    consumer_number VARCHAR(50) UNIQUE NOT NULL COMMENT 'Format: WC + Year + Sequence (e.g., WC2024000001)',
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Water department consumers/customers';

-- ============================================================
-- TABLE 2: WATER APPLICATIONS
-- Stores new connection and other applications
-- ============================================================
DROP TABLE IF EXISTS water_applications;
CREATE TABLE water_applications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    application_number VARCHAR(50) UNIQUE NOT NULL COMMENT 'Format: WNC + Year + Sequence (e.g., WNC2026000001)',
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
    INDEX idx_submitted_at (submitted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Water connection applications';

-- ============================================================
-- TABLE 3: WATER COMPLAINTS
-- Stores customer complaints
-- ============================================================
DROP TABLE IF EXISTS water_complaints;
CREATE TABLE water_complaints (
    id INT PRIMARY KEY AUTO_INCREMENT,
    complaint_number VARCHAR(50) UNIQUE NOT NULL COMMENT 'Format: WCP + Year + Sequence (e.g., WCP2026000001)',
    consumer_number VARCHAR(50) COMMENT 'Optional - linked to water_consumers',
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
    priority INT DEFAULT 5 COMMENT '1=Highest, 10=Lowest',
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
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Water department complaints';

-- ============================================================
-- TABLE 4: WATER BILLS
-- Stores monthly water bills
-- ============================================================
DROP TABLE IF EXISTS water_bills;
CREATE TABLE water_bills (
    id INT PRIMARY KEY AUTO_INCREMENT,
    bill_number VARCHAR(50) UNIQUE NOT NULL COMMENT 'Format: WB + Year + Sequence',
    consumer_id INT NOT NULL,
    consumer_number VARCHAR(50) NOT NULL,
    bill_month VARCHAR(20) NOT NULL,
    bill_year INT NOT NULL,
    bill_date DATE NOT NULL,
    due_date DATE NOT NULL,
    meter_number VARCHAR(50),
    previous_reading INT DEFAULT 0,
    current_reading INT DEFAULT 0,
    consumption_kl DECIMAL(10,2) DEFAULT 0 COMMENT 'Consumption in Kiloliters',
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Water billing records';

-- ============================================================
-- TABLE 5: WATER PAYMENTS
-- Stores payment transactions
-- ============================================================
DROP TABLE IF EXISTS water_payments;
CREATE TABLE water_payments (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Water payment transactions';

-- ============================================================
-- TABLE 6: WATER TARIFFS
-- Stores water rate tariffs
-- ============================================================
DROP TABLE IF EXISTS water_tariffs;
CREATE TABLE water_tariffs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    category VARCHAR(50) NOT NULL,
    category_name VARCHAR(100) NOT NULL,
    property_type ENUM('residential', 'commercial', 'industrial', 'institutional') NOT NULL,
    slab_1_limit INT DEFAULT 10 COMMENT 'KL limit for slab 1',
    slab_1_rate DECIMAL(10,2) NOT NULL COMMENT 'Rate per KL for slab 1',
    slab_2_limit INT DEFAULT 20,
    slab_2_rate DECIMAL(10,2) NOT NULL,
    slab_3_limit INT DEFAULT 30,
    slab_3_rate DECIMAL(10,2) NOT NULL,
    slab_4_rate DECIMAL(10,2) NOT NULL COMMENT 'Rate for consumption above slab 3',
    minimum_charge DECIMAL(10,2) DEFAULT 0,
    meter_rent DECIMAL(10,2) DEFAULT 0,
    service_charge DECIMAL(10,2) DEFAULT 0,
    sewerage_percentage DECIMAL(5,2) DEFAULT 20 COMMENT 'Sewerage charge as % of water charges',
    is_active BOOLEAN DEFAULT TRUE,
    effective_from DATE NOT NULL,
    effective_to DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_property_type (property_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Water tariff rate structure';

-- ============================================================
-- TABLE 7: WATER ADMIN USERS
-- Stores admin panel user accounts
-- ============================================================
DROP TABLE IF EXISTS water_admin_users;
CREATE TABLE water_admin_users (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Admin panel user accounts';

-- ============================================================
-- TABLE 8: WATER SETTINGS
-- Stores system configuration settings
-- ============================================================
DROP TABLE IF EXISTS water_settings;
CREATE TABLE water_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description VARCHAR(500),
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='System settings and configuration';

-- ============================================================
-- SEED DATA: Default Admin User
-- Password: admin123 (bcrypt hashed)
-- ============================================================
INSERT INTO water_admin_users (employee_id, username, password_hash, full_name, email, mobile, role, designation)
VALUES (
    'WTR-ADMIN-001', 
    'water_admin', 
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- admin123
    'Water Admin', 
    'water.admin@suvidha.gov.in', 
    '9876543210', 
    'super_admin', 
    'Chief Engineer'
) ON DUPLICATE KEY UPDATE username = VALUES(username);

-- ============================================================
-- SEED DATA: Default Tariffs
-- ============================================================
INSERT INTO water_tariffs (category, category_name, property_type, slab_1_limit, slab_1_rate, slab_2_limit, slab_2_rate, slab_3_limit, slab_3_rate, slab_4_rate, minimum_charge, meter_rent, sewerage_percentage, effective_from)
VALUES 
    ('domestic_metered', 'Domestic Metered', 'residential', 10, 5.00, 20, 10.00, 30, 15.00, 20.00, 50.00, 10.00, 20.00, '2024-01-01'),
    ('domestic_unmetered', 'Domestic Unmetered', 'residential', 0, 0, 0, 0, 0, 0, 0, 150.00, 0, 20.00, '2024-01-01'),
    ('commercial', 'Commercial', 'commercial', 10, 15.00, 30, 20.00, 50, 25.00, 30.00, 200.00, 15.00, 25.00, '2024-01-01'),
    ('industrial', 'Industrial', 'industrial', 50, 20.00, 100, 25.00, 200, 30.00, 35.00, 500.00, 25.00, 30.00, '2024-01-01'),
    ('institutional', 'Institutional', 'institutional', 20, 8.00, 50, 12.00, 100, 15.00, 18.00, 150.00, 15.00, 20.00, '2024-01-01')
ON DUPLICATE KEY UPDATE category = VALUES(category);

-- ============================================================
-- SEED DATA: Default Settings
-- ============================================================
INSERT INTO water_settings (setting_key, setting_value, setting_type, description, is_public)
VALUES 
    ('department_name', 'Municipal Water Supply Department', 'string', 'Department Name', TRUE),
    ('department_address', 'Municipal Corporation Building, Main Road, Nashik - 422001', 'string', 'Department Address', TRUE),
    ('helpline_number', '1800-XXX-XXXX', 'string', 'Toll Free Helpline', TRUE),
    ('office_email', 'water@suvidha.gov.in', 'string', 'Official Email', TRUE),
    ('late_fee_percentage', '2', 'number', 'Late Fee Percentage per month', FALSE),
    ('new_connection_fee', '500', 'number', 'New Connection Application Fee', FALSE),
    ('security_deposit_15mm', '2000', 'number', 'Security Deposit for 15mm pipe', FALSE),
    ('security_deposit_20mm', '3000', 'number', 'Security Deposit for 20mm pipe', FALSE),
    ('security_deposit_25mm', '5000', 'number', 'Security Deposit for 25mm pipe', FALSE)
ON DUPLICATE KEY UPDATE setting_key = VALUES(setting_key);

-- ============================================================
-- VERIFY TABLES CREATED
-- ============================================================
SHOW TABLES LIKE 'water_%';

-- ============================================================
-- END OF SCHEMA
-- ============================================================
