const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function seed() {
  let connection;
  try {
    console.log('🌱 Starting database seeding...\n');

    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'suvidha_electricity',
      port: process.env.DB_PORT || 3306
    });

    // Hash passwords
    const adminPassword = await bcrypt.hash('Admin@123', 10);
    const staffPassword = await bcrypt.hash('Staff@123', 10);

    // Insert admin user
    await connection.query(`
      INSERT INTO users (email, password, role, full_name, phone) 
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE email=email
    `, ['admin@electricity.gov.in', adminPassword, 'admin', 'System Administrator', '9876543210']);
    console.log('✓ Admin user created (admin@electricity.gov.in / Admin@123)');

    // Insert staff user
    await connection.query(`
      INSERT INTO users (email, password, role, full_name, phone) 
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE email=email
    `, ['staff@electricity.gov.in', staffPassword, 'staff', 'Staff Member', '9876543211']);
    console.log('✓ Staff user created (staff@electricity.gov.in / Staff@123)');

    // Insert system settings
    const settings = [
      ['tariff_residential_upto_100', '5.50', 'Residential tariff for consumption up to 100 units (Rs/unit)'],
      ['tariff_residential_101_300', '7.00', 'Residential tariff for consumption 101-300 units (Rs/unit)'],
      ['tariff_residential_above_300', '8.50', 'Residential tariff for consumption above 300 units (Rs/unit)'],
      ['tariff_commercial', '9.00', 'Commercial tariff (Rs/unit)'],
      ['tariff_industrial', '7.50', 'Industrial tariff (Rs/unit)'],
      ['tariff_agricultural', '4.00', 'Agricultural tariff (Rs/unit)'],
      ['fixed_charge_residential', '50.00', 'Monthly fixed charge for residential connections'],
      ['fixed_charge_commercial', '200.00', 'Monthly fixed charge for commercial connections'],
      ['tax_rate', '5.0', 'Tax percentage on electricity bills'],
      ['late_fee_percentage', '2.0', 'Late payment fee percentage per month'],
      ['new_connection_fee_residential', '1500.00', 'New residential connection fee'],
      ['new_connection_fee_commercial', '5000.00', 'New commercial connection fee'],
      ['reconnection_fee', '500.00', 'Reconnection fee after disconnection'],
      ['kiosk_language', 'en', 'Default kiosk language'],
      ['support_phone', '1912', 'Customer support phone number'],
      ['support_email', 'support@electricity.gov.in', 'Customer support email']
    ];

    for (const [key, value, description] of settings) {
      await connection.query(`
        INSERT INTO system_settings (setting_key, setting_value, description)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value)
      `, [key, value, description]);
    }
    console.log('✓ System settings created');

    // ============================================================
    // GAS DISTRIBUTION SEED DATA
    // ============================================================

    // Insert gas admin user
    const gasAdminPassword = await bcrypt.hash('GasAdmin@123', 10);
    await connection.query(`
      INSERT INTO gas_admin_users (employee_id, username, password_hash, full_name, email, mobile, role, designation) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE username=username
    `, ['GAS-ADMIN-001', 'gas_admin', gasAdminPassword, 'Gas Administrator', 'gas.admin@suvidha.gov.in', '9876543220', 'super_admin', 'Chief Engineer']);
    console.log('✓ Gas admin user created (gas_admin / GasAdmin@123)');

    // Insert gas tariffs
    const gasTariffs = [
      ['png_domestic', 'PNG Domestic', 'png', 'domestic', 10, 40.00, 25, 45.00, 50, 50.00, 55.00, 50.00, 50.00, 0.00, 5.00, '2024-01-01'],
      ['png_commercial', 'PNG Commercial', 'png', 'commercial', 20, 50.00, 50, 55.00, 100, 60.00, 65.00, 100.00, 100.00, 0.00, 5.00, '2024-01-01'],
      ['png_industrial', 'PNG Industrial', 'png', 'industrial', 50, 45.00, 100, 48.00, 200, 50.00, 52.00, 200.00, 150.00, 0.00, 5.00, '2024-01-01'],
      ['lpg_domestic', 'LPG Domestic', 'lpg', 'domestic', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5.00, '2024-01-01'],
      ['lpg_commercial', 'LPG Commercial', 'lpg', 'commercial', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5.00, '2024-01-01']
    ];

    for (const tariff of gasTariffs) {
      await connection.query(`
        INSERT INTO gas_tariffs (category, category_name, gas_type, property_type, slab_1_limit, slab_1_rate, 
          slab_2_limit, slab_2_rate, slab_3_limit, slab_3_rate, slab_4_rate, minimum_charge, 
          pipeline_rent, service_charge, vat_percentage, effective_from)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE category=VALUES(category)
      `, tariff);
    }
    console.log('✓ Gas tariffs created');

    // Insert gas settings
    const gasSettings = [
      ['gas_department_name', 'Municipal Gas Distribution Department', 'string', 'Department Name', true],
      ['gas_department_address', 'Gas Complex, Industrial Area, Nashik - 422001', 'string', 'Department Address', true],
      ['gas_helpline_number', '1906', 'string', 'Gas Emergency Helpline', true],
      ['gas_emergency_number', '1906', 'string', 'Gas Leak Emergency Number', true],
      ['gas_office_email', 'gas@suvidha.gov.in', 'string', 'Official Email', true],
      ['gas_late_fee_percentage', '2', 'number', 'Late Fee Percentage per month', false],
      ['gas_new_connection_fee', '500', 'number', 'New Connection Application Fee', false],
      ['gas_security_deposit_png_domestic', '3000', 'number', 'Security Deposit for PNG Domestic', false],
      ['gas_security_deposit_png_commercial', '5000', 'number', 'Security Deposit for PNG Commercial', false],
      ['gas_security_deposit_lpg', '2000', 'number', 'Security Deposit for LPG Connection', false],
      ['gas_cylinder_price_14kg', '850', 'number', 'Domestic LPG 14.2kg Cylinder Price', true],
      ['gas_cylinder_price_5kg', '450', 'number', 'Domestic LPG 5kg Cylinder Price', true],
      ['gas_cylinder_price_19kg', '2100', 'number', 'Commercial LPG 19kg Cylinder Price', true],
      ['gas_cylinder_price_47kg', '5200', 'number', 'Commercial LPG 47.5kg Cylinder Price', true]
    ];

    for (const [key, value, type, description, isPublic] of gasSettings) {
      await connection.query(`
        INSERT INTO gas_settings (setting_key, setting_value, setting_type, description, is_public)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value)
      `, [key, value, type, description, isPublic]);
    }
    console.log('✓ Gas settings created');

    // Insert sample gas consumers
    const gasConsumers = [
      ['GC2024000001', 'Rajesh Kumar', 'Ramesh Kumar', 'rajesh.gas@email.com', '9812345678', '123456789001', 'PROP-G-001', '101', 'Green Valley Apartments', '1', '101, Green Valley Apartments, Ward 1, Nashik', 'Near City Mall', 'png', 'permanent', 'active', 'domestic', 'owner', 'GM2024001', 'digital', 'domestic', 150.50],
      ['GC2024000002', 'Priya Sharma', 'Vikram Sharma', 'priya.gas@email.com', '9812345679', '123456789002', 'PROP-G-002', '205', 'Sunrise Tower', '2', '205, Sunrise Tower, Ward 2, Nashik', 'Opposite Bus Stand', 'png', 'permanent', 'active', 'domestic', 'owner', 'GM2024002', 'smart', 'domestic', 85.25],
      ['GC2024000003', 'Hotel Paradise', null, 'hotel.paradise@email.com', '9812345680', null, 'PROP-G-003', 'Shop 5', 'Commercial Complex', '3', 'Shop 5, Commercial Complex, Ward 3, Nashik', 'Main Market', 'png', 'permanent', 'active', 'commercial', 'owner', 'GM2024003', 'digital', 'commercial', 450.00],
      ['GC2024000004', 'Amit Patel', 'Suresh Patel', 'amit.lpg@email.com', '9812345681', '123456789003', 'PROP-G-004', '302', 'City Heights', '1', '302, City Heights, Ward 1, Nashik', 'Near Railway Station', 'lpg', 'permanent', 'active', 'domestic', 'tenant', null, null, 'domestic', 0]
    ];

    for (const consumer of gasConsumers) {
      await connection.query(`
        INSERT INTO gas_consumers (consumer_number, full_name, father_spouse_name, email, mobile, aadhaar_number, 
          property_id, house_flat_no, building_name, ward, address, landmark, gas_type, connection_type, 
          connection_status, property_type, ownership_status, meter_number, meter_type, tariff_category, last_meter_reading)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE consumer_number=VALUES(consumer_number)
      `, consumer);
    }
    console.log('✓ Sample gas consumers created');

    // Insert sample gas bills (for PNG consumers)
    const gasBills = [
      // Bills for Consumer 1: Rajesh Kumar (PNG Domestic) - GC2024000001
      ['GB2024000001', 1, 'GC2024000001', 'January', 2024, '2024-01-31', '2024-02-15', 'GM2024001', 100.00, 150.50, 50.50, '2024-01-30', 2275.00, 50.00, 20.00, 116.25, 0, 0, 0, 2461.25, 0, 0, 2461.25, 2461.25, 0, 'paid', 'paid', '2024-01-31 10:00:00', '2024-02-01 08:00:00', '2024-02-05 14:30:00'],
      ['GB2024000002', 1, 'GC2024000001', 'February', 2024, '2024-02-29', '2024-03-15', 'GM2024001', 150.50, 210.20, 59.70, '2024-02-28', 2689.50, 50.00, 20.00, 137.97, 0, 0, 0, 2897.47, 0, 0, 2897.47, 2897.47, 0, 'paid', 'paid', '2024-02-29 10:00:00', '2024-03-01 08:00:00', '2024-03-10 16:20:00'],
      ['GB2024000003', 1, 'GC2024000001', 'December', 2024, '2024-12-31', '2025-01-15', 'GM2024001', 820.40, 885.75, 65.35, '2024-12-30', 2941.75, 50.00, 20.00, 150.59, 0, 0, 0, 3162.34, 0, 0, 3162.34, 0, 3162.34, 'generated', 'unpaid', '2024-12-31 10:00:00', null, null],
      ['GB2025000001', 1, 'GC2024000001', 'January', 2025, '2025-01-31', '2025-02-15', 'GM2024001', 885.75, 952.30, 66.55, '2024-01-30', 2995.75, 50.00, 20.00, 153.29, 0, 0, 0, 3219.04, 0, 0, 3219.04, 0, 3219.04, 'sent', 'unpaid', '2025-01-31 10:00:00', '2025-02-01 08:00:00', null],
      
      // Bills for Consumer 2: Priya Sharma (PNG Domestic) - GC2024000002
      ['GB2024000004', 2, 'GC2024000002', 'January', 2024, '2024-01-31', '2024-02-15', 'GM2024002', 40.00, 85.25, 45.25, '2024-01-30', 2037.50, 50.00, 20.00, 105.38, 0, 0, 0, 2212.88, 0, 0, 2212.88, 2212.88, 0, 'paid', 'paid', '2024-01-31 10:00:00', '2024-02-01 08:00:00', '2024-02-08 11:15:00'],
      ['GB2024000005', 2, 'GC2024000002', 'December', 2024, '2024-12-31', '2025-01-15', 'GM2024002', 530.80, 575.40, 44.60, '2024-12-30', 2007.00, 50.00, 20.00, 103.85, 0, 0, 0, 2180.85, 0, 0, 2180.85, 2180.85, 0, 'paid', 'paid', '2024-12-31 10:00:00', '2025-01-01 08:00:00', '2025-01-10 09:45:00'],
      ['GB2025000002', 2, 'GC2024000002', 'January', 2025, '2025-01-31', '2025-02-15', 'GM2024002', 575.40, 625.85, 50.45, '2025-01-30', 2270.25, 50.00, 20.00, 117.01, 0, 0, 0, 2457.26, 0, 0, 2457.26, 0, 2457.26, 'sent', 'unpaid', '2025-01-31 10:00:00', '2025-02-01 08:00:00', null],
      
      // Bills for Consumer 3: Hotel Paradise (PNG Commercial) - GC2024000003
      ['GB2024000006', 3, 'GC2024000003', 'January', 2024, '2024-01-31', '2024-02-15', 'GM2024003', 200.00, 450.00, 250.00, '2024-01-30', 13500.00, 100.00, 50.00, 682.50, 0, 0, 0, 14332.50, 0, 0, 14332.50, 14332.50, 0, 'paid', 'paid', '2024-01-31 10:00:00', '2024-02-01 08:00:00', '2024-02-12 15:20:00'],
      ['GB2024000007', 3, 'GC2024000003', 'December', 2024, '2024-12-31', '2025-01-15', 'GM2024003', 3200.00, 3480.00, 280.00, '2024-12-30', 15120.00, 100.00, 50.00, 763.50, 0, 0, 0, 16033.50, 0, 0, 16033.50, 16033.50, 0, 'paid', 'paid', '2024-12-31 10:00:00', '2025-01-01 08:00:00', '2025-01-08 12:30:00'],
      ['GB2025000003', 3, 'GC2024000003', 'January', 2025, '2025-01-31', '2025-02-15', 'GM2024003', 3480.00, 3795.00, 315.00, '2025-01-30', 17010.00, 100.00, 50.00, 858.00, 0, 0, 0, 18018.00, 0, 0, 18018.00, 0, 18018.00, 'sent', 'unpaid', '2025-01-31 10:00:00', '2025-02-01 08:00:00', null]
    ];

    for (const bill of gasBills) {
      await connection.query(`
        INSERT INTO gas_bills (bill_number, consumer_id, consumer_number, bill_month, bill_year, bill_date, due_date, 
          meter_number, previous_reading, current_reading, consumption_scm, reading_date, 
          gas_charges, pipeline_rent, service_tax, vat, other_charges, arrears, late_fee, 
          gross_amount, discount, subsidy, total_amount, amount_paid, balance_amount, 
          status, payment_status, generated_at, sent_at, paid_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE bill_number=VALUES(bill_number)
      `, bill);
    }
    console.log('✓ Sample gas bills created');

    // Insert sample gas payments (for paid bills)
    const gasPayments = [
      ['TXN-GAS-2024-0001', 1, 'GC2024000001', 1, 'GB2024000001', 2461.25, 'card', 'bill_payment', 'razorpay', 'pay_RZP123456789001', 'success', 'RCPT-GAS-001', true, '2024-02-05 14:30:00', '2024-02-05 14:30:15'],
      ['TXN-GAS-2024-0002', 1, 'GC2024000001', 2, 'GB2024000002', 2897.47, 'upi', 'bill_payment', 'razorpay', 'pay_RZP123456789002', 'success', 'RCPT-GAS-002', true, '2024-03-10 16:20:00', '2024-03-10 16:20:10'],
      ['TXN-GAS-2024-0003', 2, 'GC2024000002', 4, 'GB2024000004', 2212.88, 'card', 'bill_payment', 'razorpay', 'pay_RZP123456789003', 'success', 'RCPT-GAS-003', true, '2024-02-08 11:15:00', '2024-02-08 11:15:08'],
      ['TXN-GAS-2024-0004', 2, 'GC2024000002', 5, 'GB2024000005', 2180.85, 'upi', 'bill_payment', 'razorpay', 'pay_RZP123456789004', 'success', 'RCPT-GAS-004', true, '2025-01-10 09:45:00', '2025-01-10 09:45:12'],
      ['TXN-GAS-2024-0005', 3, 'GC2024000003', 6, 'GB2024000006', 14332.50, 'netbanking', 'bill_payment', 'razorpay', 'pay_RZP123456789005', 'success', 'RCPT-GAS-005', true, '2024-02-12 15:20:00', '2024-02-12 15:20:25'],
      ['TXN-GAS-2024-0006', 3, 'GC2024000003', 7, 'GB2024000007', 16033.50, 'netbanking', 'bill_payment', 'razorpay', 'pay_RZP123456789006', 'success', 'RCPT-GAS-006', true, '2025-01-08 12:30:00', '2025-01-08 12:30:18']
    ];

    for (const payment of gasPayments) {
      await connection.query(`
        INSERT INTO gas_payments (transaction_id, consumer_id, consumer_number, bill_id, bill_number, amount, 
          payment_method, payment_type, payment_gateway, gateway_reference, status, receipt_number, 
          receipt_generated, initiated_at, completed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE transaction_id=VALUES(transaction_id)
      `, payment);
    }
    console.log('✓ Sample gas payments created');

    // Insert sample gas applications
    const gasApplications = [
      ['GNC2024000001', 'new_connection', 'individual', 'png', 'Amit Sharma', 'Lalit Sharma', '9876543201', 'amit.sharma@email.com', '25, Sunrise Colony, Ward 2, Nashik', '2', 'domestic', 'owner', 'cooking', 'submitted', 'Application Submitted', null, null, null, '2024-01-15 10:30:00'],
      ['GNC2024000002', 'new_connection', 'individual', 'png', 'Priya Patel', 'Vikram Patel', '9876543202', 'priya.patel@email.com', '15, Green Avenue, Ward 5, Nashik', '5', 'domestic', 'tenant', 'cooking', 'document_verification', 'Document Verification', null, '2024-01-20 14:00:00', null, '2024-01-10 09:15:00'],
      ['GNC2024000003', 'new_connection', 'firm', 'lpg', 'Restaurant Paradise', 'Suresh Kumar', '9876543203', 'paradise@email.com', '101, Main Market, Ward 1, Nashik', '1', 'commercial', 'owner', 'commercial', 'approved', 'Connection Scheduled', 'Vinod Patil', '2024-01-05 11:00:00', null, '2023-12-20 16:30:00'],
      ['GNC2024000004', 'new_connection', 'individual', 'png', 'Rahul Verma', 'Mahesh Verma', '9876543204', 'rahul.v@email.com', '42, Lake View Society, Ward 3, Nashik', '3', 'domestic', 'owner', 'cooking', 'site_inspection', 'Site Inspection', 'Ramesh Engineer', '2024-01-25 15:30:00', null, '2024-01-18 11:00:00'],
      ['GNC2024000005', 'new_connection', 'individual', 'lpg', 'Sunita Devi', 'Ram Prasad', '9876543205', 'sunita.d@email.com', '78, Housing Board Colony, Ward 7, Nashik', '7', 'domestic', 'tenant', 'cooking', 'submitted', 'Application Submitted', null, null, null, '2024-01-28 09:45:00']
    ];

    for (const app of gasApplications) {
      await connection.query(`
        INSERT INTO gas_applications (application_number, application_type, applicant_category, gas_type, full_name, 
          father_spouse_name, mobile, email, address, ward, property_type, ownership_status, connection_purpose, 
          status, current_stage, assigned_engineer, processed_at, completed_at, submitted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE application_number=VALUES(application_number)
      `, app);
    }
    console.log('✓ Sample gas applications created');

    // Insert sample gas complaints
    const gasComplaints = [
      ['GCP2024000001', 'GC2024000001', 1, 'Rajesh Kumar', '9876543101', 'rajesh@email.com', '101, Green Valley Apartments, Ward 1, Nashik', '1', 'Near City Mall', 'low-pressure', 'Gas pressure is very low in morning hours, unable to cook properly.', 'medium', 'assigned', 5, 'Vinod Technician', '2024-01-20 11:00:00', null, null, '2024-01-18 08:30:00'],
      ['GCP2024000002', null, null, 'Shyam Mohan', '9876543102', 'shyam@email.com', '45, Industrial Area, Ward 4, Nashik', '4', 'Behind Petrol Pump', 'gas-leak', 'Smell of gas near meter area, very concerning for safety.', 'critical', 'in_progress', 1, 'Emergency Team', '2024-01-25 09:00:00', null, null, '2024-01-25 08:15:00'],
      ['GCP2024000003', 'GC2024000002', 2, 'Priya Sharma', '9876543103', 'priya.s@email.com', '78, Rose Garden, Ward 2, Nashik', '2', 'Near Temple', 'meter-issue', 'Meter showing incorrect readings, bill amount seems too high.', 'medium', 'open', 5, null, null, null, null, '2024-01-26 14:20:00'],
      ['GCP2024000004', 'GC2024000003', 3, 'Hotel Paradise', '9876543104', 'hotel.paradise@email.com', '200, Commercial Complex, Ward 1, Nashik', '1', 'Main Market', 'billing-dispute', 'Charged for usage during closure period. Need bill revision.', 'low', 'open', 7, null, null, null, null, '2024-01-27 10:45:00'],
      ['GCP2024000005', null, null, 'Anita Joshi', '9876543105', 'anita.j@email.com', '33, New Housing Colony, Ward 6, Nashik', '6', 'Near School', 'no-supply', 'No gas supply since morning. All neighbors also affected.', 'high', 'assigned', 2, 'Suresh Technician', '2024-01-28 11:30:00', null, null, '2024-01-28 07:00:00']
    ];

    for (const complaint of gasComplaints) {
      await connection.query(`
        INSERT INTO gas_complaints (complaint_number, consumer_number, consumer_id, contact_name, mobile, 
          email, address, ward, landmark, complaint_category, description, urgency, status, priority, 
          assigned_engineer, assignment_date, resolved_at, closed_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE complaint_number=VALUES(complaint_number)
      `, complaint);
    }
    console.log('✓ Sample gas complaints created');

    // Sample gas cylinder bookings
    const gasConsumerResult = await connection.query('SELECT id, consumer_number, full_name, mobile, address FROM gas_consumers LIMIT 4');
    const gasConsumersList = gasConsumerResult[0];
    
    const cylinderBookings = [
      [
        'GCB2024000001', gasConsumersList[0]?.id || 1, gasConsumersList[0]?.consumer_number || 'GC2024000001',
        'domestic_14.2kg', 1, 850.00, 850.00, 'home_delivery',
        gasConsumersList[0]?.address || '123 MG Road', '10:00-12:00', 'booked', 'pending',
        new Date()
      ],
      [
        'GCB2024000002', gasConsumersList[1]?.id || 2, gasConsumersList[1]?.consumer_number || 'GC2024000002',
        'domestic_14.2kg', 2, 850.00, 1700.00, 'home_delivery',
        gasConsumersList[1]?.address || '456 Station Road', '14:00-16:00', 'confirmed', 'paid',
        new Date(Date.now() - 86400000)
      ],
      [
        'GCB2024000003', gasConsumersList[2]?.id || 3, gasConsumersList[2]?.consumer_number || 'GC2024000003',
        'domestic_5kg', 3, 450.00, 1350.00, 'home_delivery',
        gasConsumersList[2]?.address || '789 Gandhi Nagar', '16:00-18:00', 'dispatched', 'paid',
        new Date(Date.now() - 172800000)
      ],
      [
        'GCB2024000004', gasConsumersList[3]?.id || 4, gasConsumersList[3]?.consumer_number || 'GC2024000004',
        'commercial_19kg', 1, 2100.00, 2100.00, 'pickup',
        gasConsumersList[3]?.address || '321 Industrial Area', null, 'delivered', 'paid',
        new Date(Date.now() - 259200000)
      ],
      [
        'GCB2024000005', gasConsumersList[0]?.id || 1, gasConsumersList[0]?.consumer_number || 'GC2024000001',
        'domestic_14.2kg', 1, 850.00, 850.00, 'home_delivery',
        gasConsumersList[0]?.address || '123 MG Road', '10:00-12:00', 'delivered', 'paid',
        new Date(Date.now() - 604800000)
      ]
    ];

    for (const booking of cylinderBookings) {
      await connection.query(`
        INSERT INTO gas_cylinder_bookings (booking_number, consumer_id, consumer_number,
          cylinder_type, quantity, unit_price, total_amount, delivery_preference,
          delivery_address, delivery_time_slot, status, payment_status, booked_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE booking_number=VALUES(booking_number)
      `, booking);
    }
    console.log('✓ Sample gas cylinder bookings created');

    console.log('\n✅ Database seeded successfully!');
    console.log('\n📝 Login Credentials:');
    console.log('\n🔐 ADMIN LOGIN:');
    console.log('  Email: admin@electricity.gov.in');
    console.log('  Password: Admin@123');
    console.log('  Admin Panel URL: http://localhost:5174/login');
    console.log('\n👤 STAFF LOGIN:');
    console.log('  Email: staff@electricity.gov.in');
    console.log('  Password: Staff@123');
    console.log('  Admin Panel URL: http://localhost:5174/login');
    console.log('\n🔥 GAS ADMIN LOGIN:');
    console.log('  Username: gas_admin');
    console.log('  Password: GasAdmin@123');
    console.log('  Gas Admin Panel URL: http://localhost:5177/login\n');

  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

seed();
