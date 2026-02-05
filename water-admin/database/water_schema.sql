-- =====================================================
-- SUVIDHA WATER DEPARTMENT DATABASE SCHEMA
-- Complete SQL for Water Services Management
-- Database: suvidha (same database, separate tables)
-- =====================================================

-- Use existing suvidha database
USE suvidha;

-- =====================================================
-- 1. WATER CONSUMERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS water_consumers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    consumer_number VARCHAR(50) UNIQUE NOT NULL,
    
    -- Personal Details
    full_name VARCHAR(255) NOT NULL,
    father_spouse_name VARCHAR(255),
    email VARCHAR(255),
    mobile VARCHAR(15) NOT NULL,
    alternate_mobile VARCHAR(15),
    aadhaar_number VARCHAR(12),
    
    -- Property Details  
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
    
    -- Connection Details
    connection_type ENUM('permanent', 'temporary') DEFAULT 'permanent',
    connection_status ENUM('active', 'inactive', 'disconnected', 'pending') DEFAULT 'active',
    property_type ENUM('residential', 'commercial', 'industrial', 'institutional', 'construction') DEFAULT 'residential',
    ownership_status ENUM('owner', 'tenant', 'leaseholder') DEFAULT 'owner',
    pipe_size ENUM('15mm', '20mm', '25mm', '40mm', '50mm') DEFAULT '15mm',
    meter_number VARCHAR(50),
    meter_type ENUM('mechanical', 'digital', 'smart') DEFAULT 'mechanical',
    
    -- Billing Info
    tariff_category VARCHAR(50) DEFAULT 'domestic',
    billing_cycle ENUM('monthly', 'bi-monthly', 'quarterly') DEFAULT 'monthly',
    outstanding_amount DECIMAL(12,2) DEFAULT 0,
    last_payment_date DATE,
    last_payment_amount DECIMAL(12,2),
    
    -- Connection Dates
    connection_date DATE,
    last_meter_reading_date DATE,
    last_meter_reading INT DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_consumer_number (consumer_number),
    INDEX idx_mobile (mobile),
    INDEX idx_property_id (property_id),
    INDEX idx_ward (ward),
    INDEX idx_status (connection_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- 2. WATER CONNECTION APPLICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS water_applications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    application_number VARCHAR(50) UNIQUE NOT NULL,
    application_type ENUM('new_connection', 'reconnection', 'disconnection', 'transfer', 'pipe_size_change', 'meter_change') NOT NULL,
    
    -- Applicant Details
    applicant_category ENUM('individual', 'housing_society', 'firm', 'private_company', 'trust', 'government') DEFAULT 'individual',
    full_name VARCHAR(255) NOT NULL,
    father_spouse_name VARCHAR(255),
    aadhaar_number VARCHAR(12),
    mobile VARCHAR(15) NOT NULL,
    email VARCHAR(255),
    
    -- Property Details
    property_id VARCHAR(100),
    house_flat_no VARCHAR(50),
    building_name VARCHAR(255),
    ward VARCHAR(20),
    address TEXT NOT NULL,
    landmark VARCHAR(255),
    property_type ENUM('residential', 'commercial', 'industrial', 'institutional', 'construction') DEFAULT 'residential',
    ownership_status ENUM('owner', 'tenant', 'leaseholder') DEFAULT 'owner',
    
    -- Connection Request Details
    connection_purpose ENUM('drinking', 'construction', 'gardening', 'industrial') DEFAULT 'drinking',
    pipe_size_requested ENUM('15mm', '20mm', '25mm', '40mm', '50mm') DEFAULT '15mm',
    connection_type_requested ENUM('permanent', 'temporary') DEFAULT 'permanent',
    
    -- Application Status
    status ENUM('submitted', 'document_verification', 'site_inspection', 'approval_pending', 'approved', 'rejected', 'work_in_progress', 'completed') DEFAULT 'submitted',
    current_stage VARCHAR(100) DEFAULT 'Application Submitted',
    stage_history JSON,
    
    -- Documents
    documents JSON,
    
    -- Fees
    application_fee DECIMAL(10,2) DEFAULT 0,
    connection_fee DECIMAL(10,2) DEFAULT 0,
    security_deposit DECIMAL(10,2) DEFAULT 0,
    total_fee DECIMAL(10,2) DEFAULT 0,
    fee_paid BOOLEAN DEFAULT FALSE,
    payment_date DATE,
    payment_reference VARCHAR(100),
    
    -- Assignment
    assigned_to INT,
    assigned_engineer VARCHAR(255),
    
    -- Remarks
    remarks TEXT,
    rejection_reason TEXT,
    
    -- Timestamps
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_app_number (application_number),
    INDEX idx_status (status),
    INDEX idx_mobile (mobile),
    INDEX idx_ward (ward),
    INDEX idx_submitted_at (submitted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- 3. WATER COMPLAINTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS water_complaints (
    id INT PRIMARY KEY AUTO_INCREMENT,
    complaint_number VARCHAR(50) UNIQUE NOT NULL,
    
    -- Consumer Info (optional - can register without being consumer)
    consumer_number VARCHAR(50),
    consumer_id INT,
    
    -- Complainant Details (Required)
    contact_name VARCHAR(255) NOT NULL,
    mobile VARCHAR(15) NOT NULL,
    email VARCHAR(255),
    
    -- Location (Required for resolution)
    address TEXT,
    ward VARCHAR(20),
    landmark VARCHAR(255),
    
    -- Complaint Details (Required)
    complaint_category ENUM('no-water', 'low-pressure', 'contaminated', 'pipeline-leak', 'meter-stopped', 'high-bill', 'illegal-connection', 'sewerage', 'other') NOT NULL,
    description TEXT NOT NULL,
    urgency ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    
    -- Status & Priority
    status ENUM('open', 'assigned', 'in_progress', 'resolved', 'closed', 'reopened') DEFAULT 'open',
    priority INT DEFAULT 5,
    
    -- Assignment (For admin use)
    assigned_engineer VARCHAR(255),
    assignment_date TIMESTAMP NULL,
    
    -- Resolution (For admin use)
    resolution_notes TEXT,
    resolved_at TIMESTAMP NULL,
    closed_at TIMESTAMP NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_complaint_number (complaint_number),
    INDEX idx_consumer_number (consumer_number),
    INDEX idx_status (status),
    INDEX idx_category (complaint_category),
    INDEX idx_ward (ward),
    INDEX idx_created_at (created_at),
    INDEX idx_mobile (mobile),
    
    FOREIGN KEY (consumer_id) REFERENCES water_consumers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- 4. WATER BILLS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS water_bills (
    id INT PRIMARY KEY AUTO_INCREMENT,
    bill_number VARCHAR(50) UNIQUE NOT NULL,
    
    -- Consumer Reference
    consumer_id INT NOT NULL,
    consumer_number VARCHAR(50) NOT NULL,
    
    -- Billing Period
    bill_month VARCHAR(20) NOT NULL,
    bill_year INT NOT NULL,
    bill_date DATE NOT NULL,
    due_date DATE NOT NULL,
    
    -- Meter Reading
    meter_number VARCHAR(50),
    previous_reading INT DEFAULT 0,
    current_reading INT DEFAULT 0,
    consumption_kl DECIMAL(10,2) DEFAULT 0,
    reading_date DATE,
    
    -- Charges Breakdown
    water_charges DECIMAL(10,2) DEFAULT 0,
    sewerage_charges DECIMAL(10,2) DEFAULT 0,
    service_tax DECIMAL(10,2) DEFAULT 0,
    meter_rent DECIMAL(10,2) DEFAULT 0,
    other_charges DECIMAL(10,2) DEFAULT 0,
    arrears DECIMAL(10,2) DEFAULT 0,
    late_fee DECIMAL(10,2) DEFAULT 0,
    
    -- Totals
    gross_amount DECIMAL(12,2) DEFAULT 0,
    discount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL,
    amount_paid DECIMAL(12,2) DEFAULT 0,
    balance_amount DECIMAL(12,2) DEFAULT 0,
    
    -- Status
    status ENUM('generated', 'sent', 'paid', 'partially_paid', 'overdue', 'disputed') DEFAULT 'generated',
    payment_status ENUM('unpaid', 'paid', 'partial') DEFAULT 'unpaid',
    
    -- Timestamps
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP NULL,
    paid_at TIMESTAMP NULL,
    
    INDEX idx_bill_number (bill_number),
    INDEX idx_consumer_id (consumer_id),
    INDEX idx_consumer_number (consumer_number),
    INDEX idx_bill_month (bill_month, bill_year),
    INDEX idx_status (status),
    INDEX idx_due_date (due_date),
    
    FOREIGN KEY (consumer_id) REFERENCES water_consumers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- 5. WATER PAYMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS water_payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    transaction_id VARCHAR(100) UNIQUE NOT NULL,
    
    -- References
    consumer_id INT NOT NULL,
    consumer_number VARCHAR(50) NOT NULL,
    bill_id INT,
    bill_number VARCHAR(50),
    
    -- Payment Details
    amount DECIMAL(12,2) NOT NULL,
    payment_method ENUM('upi', 'card', 'netbanking', 'cash', 'cheque', 'wallet', 'pos') NOT NULL,
    payment_gateway VARCHAR(50),
    gateway_reference VARCHAR(100),
    
    -- Status
    status ENUM('initiated', 'processing', 'success', 'failed', 'refunded') DEFAULT 'initiated',
    
    -- Receipt
    receipt_number VARCHAR(50),
    receipt_generated BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    ip_address VARCHAR(45),
    device_info VARCHAR(255),
    
    -- Timestamps
    initiated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    
    INDEX idx_transaction_id (transaction_id),
    INDEX idx_consumer_id (consumer_id),
    INDEX idx_consumer_number (consumer_number),
    INDEX idx_bill_id (bill_id),
    INDEX idx_status (status),
    INDEX idx_initiated_at (initiated_at),
    
    FOREIGN KEY (consumer_id) REFERENCES water_consumers(id) ON DELETE CASCADE,
    FOREIGN KEY (bill_id) REFERENCES water_bills(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- 6. WATER METER READINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS water_meter_readings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    
    -- Consumer Reference
    consumer_id INT NOT NULL,
    consumer_number VARCHAR(50) NOT NULL,
    meter_number VARCHAR(50) NOT NULL,
    
    -- Reading Details
    reading_date DATE NOT NULL,
    reading_value INT NOT NULL,
    previous_reading INT DEFAULT 0,
    consumption_kl DECIMAL(10,2) DEFAULT 0,
    
    -- Reader Info
    reader_id INT,
    reader_name VARCHAR(255),
    
    -- Status
    status ENUM('recorded', 'verified', 'disputed', 'corrected') DEFAULT 'recorded',
    
    -- Image proof (if any)
    meter_image_url VARCHAR(500),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP NULL,
    
    INDEX idx_consumer_id (consumer_id),
    INDEX idx_meter_number (meter_number),
    INDEX idx_reading_date (reading_date),
    
    FOREIGN KEY (consumer_id) REFERENCES water_consumers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- 7. WATER TARIFF TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS water_tariffs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    
    -- Category
    category VARCHAR(50) NOT NULL,
    category_name VARCHAR(100) NOT NULL,
    property_type ENUM('residential', 'commercial', 'industrial', 'institutional') NOT NULL,
    
    -- Slab-based Pricing (per KL)
    slab_1_limit INT DEFAULT 10,
    slab_1_rate DECIMAL(10,2) NOT NULL,
    slab_2_limit INT DEFAULT 20,
    slab_2_rate DECIMAL(10,2) NOT NULL,
    slab_3_limit INT DEFAULT 30,
    slab_3_rate DECIMAL(10,2) NOT NULL,
    slab_4_rate DECIMAL(10,2) NOT NULL,
    
    -- Fixed Charges
    minimum_charge DECIMAL(10,2) DEFAULT 0,
    meter_rent DECIMAL(10,2) DEFAULT 0,
    service_charge DECIMAL(10,2) DEFAULT 0,
    sewerage_percentage DECIMAL(5,2) DEFAULT 20,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    effective_from DATE NOT NULL,
    effective_to DATE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_category (category),
    INDEX idx_property_type (property_type),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- 8. WATER ADMIN USERS TABLE (Separate for Water Dept)
-- =====================================================
CREATE TABLE IF NOT EXISTS water_admin_users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    
    -- Personal Info
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    mobile VARCHAR(15),
    
    -- Role & Permissions
    role ENUM('super_admin', 'admin', 'manager', 'engineer', 'billing_officer', 'field_staff', 'viewer') NOT NULL DEFAULT 'viewer',
    department VARCHAR(100) DEFAULT 'Water Supply',
    designation VARCHAR(100),
    ward_assigned VARCHAR(50),
    
    -- Status
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    last_login TIMESTAMP NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- 9. WATER ACTIVITY LOG TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS water_activity_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    
    -- User Info
    user_id INT,
    user_name VARCHAR(255),
    user_role VARCHAR(50),
    
    -- Activity Details
    activity_type ENUM('login', 'logout', 'create', 'update', 'delete', 'approve', 'reject', 'assign', 'view', 'export') NOT NULL,
    module VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id INT,
    
    -- Details
    description TEXT,
    old_values JSON,
    new_values JSON,
    
    -- Request Info
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    
    -- Timestamp
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_activity_type (activity_type),
    INDEX idx_module (module),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- 10. WATER SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS water_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description VARCHAR(500),
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- INSERT DEFAULT DATA
-- =====================================================

-- Insert Default Admin User (password: admin123)
INSERT INTO water_admin_users (employee_id, username, password_hash, full_name, email, mobile, role, designation)
VALUES ('WTR-ADMIN-001', 'water_admin', '$2b$10$8K1p/a0dR1xE3m.VcO3KhOhQJ7wVwkM6/8xVz5X3zH0X2W5Y0Z3Q6', 
        'Water Admin', 'water.admin@suvidha.gov.in', '9876543210', 'super_admin', 'Chief Engineer')
ON DUPLICATE KEY UPDATE username = username;

-- Insert Default Tariffs
INSERT INTO water_tariffs (category, category_name, property_type, slab_1_limit, slab_1_rate, slab_2_limit, slab_2_rate, slab_3_limit, slab_3_rate, slab_4_rate, minimum_charge, meter_rent, sewerage_percentage, effective_from) VALUES
('domestic_metered', 'Domestic Metered', 'residential', 10, 5.00, 20, 10.00, 30, 15.00, 20.00, 50.00, 10.00, 20.00, '2024-01-01'),
('domestic_unmetered', 'Domestic Unmetered', 'residential', 0, 0, 0, 0, 0, 0, 0, 150.00, 0, 20.00, '2024-01-01'),
('commercial', 'Commercial', 'commercial', 10, 15.00, 30, 20.00, 50, 25.00, 30.00, 200.00, 15.00, 25.00, '2024-01-01'),
('industrial', 'Industrial', 'industrial', 50, 20.00, 100, 25.00, 200, 30.00, 35.00, 500.00, 25.00, 30.00, '2024-01-01'),
('institutional', 'Institutional', 'institutional', 20, 8.00, 50, 12.00, 100, 15.00, 18.00, 150.00, 15.00, 20.00, '2024-01-01')
ON DUPLICATE KEY UPDATE category = VALUES(category);

-- Insert Default Settings
INSERT INTO water_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
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

-- =====================================================
-- VIEWS FOR REPORTING
-- =====================================================

-- Dashboard Stats View
CREATE OR REPLACE VIEW water_dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM water_consumers WHERE connection_status = 'active') as total_consumers,
    (SELECT COUNT(*) FROM water_consumers WHERE connection_status = 'active') as active_connections,
    (SELECT COUNT(*) FROM water_applications WHERE status = 'submitted') as pending_applications,
    (SELECT COUNT(*) FROM water_complaints WHERE status IN ('open', 'assigned', 'in_progress')) as open_complaints,
    (SELECT COALESCE(SUM(amount), 0) FROM water_payments WHERE status = 'success' AND DATE(completed_at) = CURDATE()) as today_revenue,
    (SELECT COALESCE(SUM(amount), 0) FROM water_payments WHERE status = 'success' AND MONTH(completed_at) = MONTH(CURDATE()) AND YEAR(completed_at) = YEAR(CURDATE())) as month_revenue,
    (SELECT COUNT(*) FROM water_applications WHERE DATE(submitted_at) = CURDATE()) as today_applications,
    (SELECT COUNT(*) FROM water_complaints WHERE DATE(created_at) = CURDATE()) as today_complaints;

-- Monthly Revenue View
CREATE OR REPLACE VIEW water_monthly_revenue AS
SELECT 
    YEAR(completed_at) as year,
    MONTH(completed_at) as month,
    DATE_FORMAT(completed_at, '%b %Y') as month_name,
    COUNT(*) as transaction_count,
    SUM(amount) as total_revenue
FROM water_payments 
WHERE status = 'success'
GROUP BY YEAR(completed_at), MONTH(completed_at)
ORDER BY year DESC, month DESC
LIMIT 12;

-- Applications by Status View
CREATE OR REPLACE VIEW water_applications_by_status AS
SELECT 
    status,
    COUNT(*) as count
FROM water_applications
GROUP BY status;

-- Complaints by Category View
CREATE OR REPLACE VIEW water_complaints_by_category AS
SELECT 
    complaint_category,
    COUNT(*) as count,
    SUM(CASE WHEN status IN ('open', 'assigned', 'in_progress') THEN 1 ELSE 0 END) as pending,
    SUM(CASE WHEN status IN ('resolved', 'closed') THEN 1 ELSE 0 END) as resolved
FROM water_complaints
GROUP BY complaint_category;

-- =====================================================
-- END OF WATER SCHEMA
-- =====================================================
