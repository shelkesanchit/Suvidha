/**
 * Water Department Seed Script
 * Run this to populate sample data for water tables
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function runSeed() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'suvidha',
      port: process.env.DB_PORT || 3306
    });

    console.log('\n🌊 WATER DEPARTMENT DATABASE SEEDING');
    console.log('=====================================\n');

    // 1. Seed Admin User
    console.log('Seeding admin users...');
    const passwordHash = await bcrypt.hash('admin123', 10);
    
    await connection.query(`
      INSERT INTO water_admin_users (employee_id, username, password_hash, full_name, email, mobile, role, designation)
      VALUES 
        ('WTR-ADMIN-001', 'water_admin', ?, 'Water Admin', 'water.admin@suvidha.gov.in', '9876543210', 'super_admin', 'Chief Engineer'),
        ('WTR-ENG-001', 'water_engineer', ?, 'Rajesh Kumar', 'rajesh.kumar@suvidha.gov.in', '9876543211', 'engineer', 'Junior Engineer'),
        ('WTR-BILL-001', 'water_billing', ?, 'Priya Sharma', 'priya.sharma@suvidha.gov.in', '9876543212', 'billing_officer', 'Billing Clerk')
      ON DUPLICATE KEY UPDATE username = username
    `, [passwordHash, passwordHash, passwordHash]);
    console.log('  ✓ Admin users seeded');

    // 2. Seed Tariffs
    console.log('Seeding tariffs...');
    await connection.query(`
      INSERT INTO water_tariffs (category, category_name, property_type, slab_1_limit, slab_1_rate, slab_2_limit, slab_2_rate, slab_3_limit, slab_3_rate, slab_4_rate, minimum_charge, meter_rent, sewerage_percentage, effective_from)
      VALUES 
        ('domestic_metered', 'Domestic Metered', 'residential', 10, 5.00, 20, 10.00, 30, 15.00, 20.00, 50.00, 10.00, 20.00, '2024-01-01'),
        ('domestic_unmetered', 'Domestic Unmetered', 'residential', 0, 0, 0, 0, 0, 0, 0, 150.00, 0, 20.00, '2024-01-01'),
        ('commercial', 'Commercial', 'commercial', 10, 15.00, 30, 20.00, 50, 25.00, 30.00, 200.00, 15.00, 25.00, '2024-01-01'),
        ('industrial', 'Industrial', 'industrial', 50, 20.00, 100, 25.00, 200, 30.00, 35.00, 500.00, 25.00, 30.00, '2024-01-01'),
        ('institutional', 'Institutional', 'institutional', 20, 8.00, 50, 12.00, 100, 15.00, 18.00, 150.00, 15.00, 20.00, '2024-01-01')
      ON DUPLICATE KEY UPDATE category = VALUES(category)
    `);
    console.log('  ✓ Tariffs seeded');

    // 3. Seed Settings
    console.log('Seeding settings...');
    await connection.query(`
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
      ON DUPLICATE KEY UPDATE setting_key = VALUES(setting_key)
    `);
    console.log('  ✓ Settings seeded');

    // 4. Seed Sample Consumers
    console.log('Seeding sample consumers...');
    await connection.query(`
      INSERT INTO water_consumers (consumer_number, full_name, father_spouse_name, email, mobile, aadhaar_number, property_id, house_flat_no, building_name, ward, address, property_type, ownership_status, pipe_size, meter_number, connection_status, connection_date, last_meter_reading)
      VALUES 
        ('WC2024000001', 'Ramesh Patil', 'Shankar Patil', 'ramesh.patil@email.com', '9876543001', '123456789012', 'PROP-001', '101', 'Green Valley Apartments', '1', '101, Green Valley Apartments, Ward 1, Nashik', 'residential', 'owner', '15mm', 'WM-001', 'active', '2024-01-15', 4520),
        ('WC2024000002', 'Sunita Sharma', 'Mohan Sharma', 'sunita.sharma@email.com', '9876543002', '234567890123', 'PROP-002', '202', 'Blue Heights', '2', '202, Blue Heights, Ward 2, Nashik', 'residential', 'owner', '15mm', 'WM-002', 'active', '2024-02-01', 3890),
        ('WC2024000003', 'Hotel Paradise', 'N/A', 'hotel.paradise@email.com', '9876543003', NULL, 'PROP-003', 'G-1', 'Commercial Complex', '3', 'G-1, Commercial Complex, Ward 3, Nashik', 'commercial', 'owner', '25mm', 'WM-003', 'active', '2023-06-01', 15600),
        ('WC2024000004', 'Government School', 'N/A', 'school@email.com', '9876543004', NULL, 'PROP-004', '1', 'School Building', '4', 'Government School, Ward 4, Nashik', 'institutional', 'owner', '40mm', 'WM-004', 'active', '2020-01-01', 28900),
        ('WC2024000005', 'Amit Kumar', 'Vijay Kumar', 'amit.kumar@email.com', '9876543005', '345678901234', 'PROP-005', '303', 'Sunrise Apartments', '1', '303, Sunrise Apartments, Ward 1, Nashik', 'residential', 'tenant', '15mm', 'WM-005', 'active', '2024-03-01', 2100)
      ON DUPLICATE KEY UPDATE consumer_number = VALUES(consumer_number)
    `);
    console.log('  ✓ Sample consumers seeded');

    // 5. Seed Sample Applications
    console.log('Seeding sample applications...');
    const stageHistory = JSON.stringify([{
      stage: 'Application Submitted',
      status: 'submitted',
      timestamp: new Date().toISOString(),
      remarks: 'Application submitted successfully'
    }]);
    
    await connection.query(`
      INSERT INTO water_applications (application_number, application_type, applicant_category, full_name, father_spouse_name, aadhaar_number, mobile, email, property_id, house_flat_no, building_name, ward, address, property_type, ownership_status, connection_purpose, pipe_size_requested, connection_type_requested, status, current_stage, stage_history, application_fee, connection_fee, security_deposit, total_fee)
      VALUES 
        ('WNC2026000001', 'new_connection', 'individual', 'Suresh Jadhav', 'Ramchandra Jadhav', '456789012345', '9373127347', 'suresh.jadhav@email.com', 'PROP-006', '404', 'New Heights', '2', '404, New Heights, Ward 2, Nashik', 'residential', 'owner', 'drinking', '15mm', 'permanent', 'submitted', 'Application Submitted', ?, 500, 2000, 2000, 4500),
        ('WNC2026000002', 'new_connection', 'housing_society', 'ABC Housing Society', 'N/A', NULL, '9876543020', 'abc.society@email.com', 'PROP-007', '1-50', 'ABC Society', '3', 'ABC Housing Society, Ward 3, Nashik', 'residential', 'owner', 'drinking', '50mm', 'permanent', 'document_verification', 'Document Verification', ?, 500, 15000, 15000, 30500),
        ('WNC2026000003', 'new_connection', 'firm', 'XYZ Restaurant', 'N/A', NULL, '9876543021', 'xyz.restaurant@email.com', 'PROP-008', 'Shop-5', 'Market Complex', '1', 'Shop-5, Market Complex, Ward 1, Nashik', 'commercial', 'tenant', 'drinking', '25mm', 'permanent', 'site_inspection', 'Site Inspection Scheduled', ?, 500, 5000, 5000, 10500)
      ON DUPLICATE KEY UPDATE application_number = VALUES(application_number)
    `, [stageHistory, stageHistory, stageHistory]);
    console.log('  ✓ Sample applications seeded');

    // 6. Seed Sample Complaints
    console.log('Seeding sample complaints...');
    await connection.query(`
      INSERT INTO water_complaints (complaint_number, consumer_number, contact_name, mobile, email, address, ward, complaint_category, description, urgency, status, priority)
      VALUES 
        ('WCP2026000001', 'WC2024000001', 'Ramesh Patil', '9876543001', 'ramesh.patil@email.com', '101, Green Valley Apartments', '1', 'low-pressure', 'Water pressure is very low since last 3 days', 'medium', 'open', 5),
        ('WCP2026000002', 'WC2024000002', 'Sunita Sharma', '9876543002', 'sunita.sharma@email.com', '202, Blue Heights', '2', 'no-water', 'No water supply since morning', 'high', 'assigned', 2),
        ('WCP2026000003', NULL, 'Vijay Singh', '9876543030', 'vijay.singh@email.com', 'Near Bus Stand, Ward 4', '4', 'pipeline-leak', 'Pipeline leakage near bus stand, water is wasting', 'critical', 'in_progress', 1),
        ('WCP2026000004', 'WC2024000003', 'Hotel Paradise', '9876543003', 'hotel.paradise@email.com', 'G-1, Commercial Complex', '3', 'high-bill', 'Bill amount is unusually high this month', 'low', 'open', 7),
        ('WCP2026000005', 'WC2024000005', 'Amit Kumar', '9876543005', 'amit.kumar@email.com', '303, Sunrise Apartments', '1', 'contaminated', 'Water is coming yellowish with bad smell', 'high', 'open', 3)
      ON DUPLICATE KEY UPDATE complaint_number = VALUES(complaint_number)
    `);
    console.log('  ✓ Sample complaints seeded');

    // 7. Seed Sample Bills
    console.log('Seeding sample bills...');
    await connection.query(`
      INSERT INTO water_bills (bill_number, consumer_id, consumer_number, bill_month, bill_year, bill_date, due_date, meter_number, previous_reading, current_reading, consumption_kl, water_charges, sewerage_charges, service_tax, meter_rent, total_amount, payment_status)
      VALUES 
        ('WB2026000001', 1, 'WC2024000001', 'January', 2026, '2026-01-01', '2026-01-15', 'WM-001', 4400, 4520, 12, 120, 24, 8.64, 10, 162.64, 'unpaid'),
        ('WB2026000002', 2, 'WC2024000002', 'January', 2026, '2026-01-01', '2026-01-15', 'WM-002', 3800, 3890, 9, 90, 18, 6.48, 10, 124.48, 'paid'),
        ('WB2026000003', 3, 'WC2024000003', 'January', 2026, '2026-01-01', '2026-01-15', 'WM-003', 15200, 15600, 40, 950, 237.50, 71.25, 15, 1273.75, 'unpaid')
      ON DUPLICATE KEY UPDATE bill_number = VALUES(bill_number)
    `);
    console.log('  ✓ Sample bills seeded');

    // 8. Seed Sample Payments
    console.log('Seeding sample payments...');
    await connection.query(`
      INSERT INTO water_payments (transaction_id, consumer_id, consumer_number, bill_id, bill_number, amount, payment_method, status, receipt_number, receipt_generated, completed_at)
      VALUES 
        ('WTR1706789123456', 2, 'WC2024000002', 2, 'WB2026000002', 124.48, 'upi', 'success', 'WRCP2026000001', TRUE, '2026-01-10 14:30:00'),
        ('WTR1706789123457', 1, 'WC2024000001', NULL, NULL, 200.00, 'cash', 'success', 'WRCP2026000002', TRUE, '2025-12-20 10:15:00')
      ON DUPLICATE KEY UPDATE transaction_id = VALUES(transaction_id)
    `);
    console.log('  ✓ Sample payments seeded');

    console.log('\n✅ All water data seeded successfully!\n');
    console.log('📝 Default Admin Login Credentials:');
    console.log('   Username: water_admin');
    console.log('   Password: admin123\n');

  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    if (error.code === 'ER_NO_SUCH_TABLE') {
      console.error('Run the migration first: node scripts/water-migrate.js');
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runSeed();
