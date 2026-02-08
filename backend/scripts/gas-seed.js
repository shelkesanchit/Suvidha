const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function seed() {
  let connection;
  try {
    console.log('\n🔥 GAS/LPG DEPARTMENT - DATABASE SEEDING');
    console.log('=========================================\n');

    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'suvidha',
      port: process.env.DB_PORT || 3306
    });

    // Insert gas admin user
    const gasAdminPassword = await bcrypt.hash('GasAdmin@123', 10);
    await connection.query(`
      INSERT INTO gas_admin_users (username, password, full_name, email, phone, role) 
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE username=username
    `, ['gas_admin', gasAdminPassword, 'Gas Administrator', 'gas.admin@suvidha.gov.in', '9876543220', 'super_admin']);
    console.log('✓ Gas admin user created (gas_admin / GasAdmin@123)');

    // Insert gas tariffs
    const gasTariffs = [
      ['PNG', 'residential', null, 0, 25, 40.00, 25.00, '2024-01-01', null, true],
      ['PNG', 'residential', null, 26, 50, 45.00, 25.00, '2024-01-01', null, true],
      ['PNG', 'residential', null, 51, null, 50.00, 25.00, '2024-01-01', null, true],
      ['PNG', 'commercial', null, 0, 50, 50.00, 100.00, '2024-01-01', null, true],
      ['PNG', 'commercial', null, 51, null, 55.00, 100.00, '2024-01-01', null, true],
      ['PNG', 'industrial', null, 0, 100, 45.00, 200.00, '2024-01-01', null, true],
      ['PNG', 'industrial', null, 101, null, 48.00, 200.00, '2024-01-01', null, true],
      ['LPG', 'residential', '14.2kg', null, null, 850.00, 0.00, '2024-01-01', null, true],
      ['LPG', 'residential', '5kg', null, null, 450.00, 0.00, '2024-01-01', null, true],
      ['LPG', 'commercial', '19kg', null, null, 2100.00, 0.00, '2024-01-01', null, true]
    ];

    for (const tariff of gasTariffs) {
      await connection.query(`
        INSERT INTO gas_tariffs (connection_type, consumer_type, cylinder_type, slab_from, slab_to, rate, 
          fixed_charge, effective_from, effective_to, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE connection_type=VALUES(connection_type)
      `, tariff);
    }
    console.log('✓ Gas tariffs created');

    // Insert gas settings
    const gasSettings = [
      ['gas_department_name', 'Municipal Gas Distribution Department', 'Department Name', 'general'],
      ['gas_department_address', 'Gas Complex, Industrial Area, Nashik - 422001', 'Department Address', 'general'],
      ['gas_helpline_number', '1906', 'Gas Emergency Helpline', 'contact'],
      ['gas_emergency_number', '1906', 'Gas Leak Emergency Number', 'contact'],
      ['gas_office_email', 'gas@suvidha.gov.in', 'Official Email', 'contact'],
      ['gas_late_fee_percentage', '2', 'Late Fee Percentage per month', 'billing'],
      ['gas_new_connection_fee', '500', 'New Connection Application Fee', 'fees'],
      ['gas_security_deposit_png_domestic', '3000', 'Security Deposit for PNG Domestic', 'fees'],
      ['gas_security_deposit_png_commercial', '5000', 'Security Deposit for PNG Commercial', 'fees'],
      ['gas_security_deposit_lpg', '2000', 'Security Deposit for LPG Connection', 'fees'],
      ['gas_cylinder_price_14kg', '850', 'Domestic LPG 14.2kg Cylinder Price', 'pricing'],
      ['gas_cylinder_price_5kg', '450', 'Domestic LPG 5kg Cylinder Price', 'pricing'],
      ['gas_cylinder_price_19kg', '2100', 'Commercial LPG 19kg Cylinder Price', 'pricing']
    ];

    for (const [key, value, description, category] of gasSettings) {
      await connection.query(`
        INSERT INTO gas_settings (setting_key, setting_value, description, category)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value)
      `, [key, value, description, category]);
    }
    console.log('✓ Gas settings created');

    // Insert sample gas consumers
    const gasConsumers = [
      ['GC2024000001', null, 'Rajesh Kumar', 'rajesh.gas@email.com', '9812345678', '1990-05-15', '123456789001', 'ABCDE1234F', 'PNG', 'residential', '101, Green Valley Apartments', 'Near City Mall', 'Nashik', 'Maharashtra', '422001', 'Near City Mall', 'active', '2024-01-10', 3000.00],
      ['GC2024000002', null, 'Priya Sharma', 'priya.gas@email.com', '9812345679', '1985-08-22', '123456789002', 'BCDEF2345G', 'PNG', 'residential', '205, Sunrise Tower', 'Opposite Bus Stand', 'Nashik', 'Maharashtra', '422002', 'Opposite Bus Stand', 'active', '2024-01-15', 3000.00],
      ['GC2024000003', null, 'Hotel Paradise', 'hotel.paradise@email.com', '9812345680', null, null, null, 'PNG', 'commercial', 'Shop 5, Commercial Complex', 'Main Market', 'Nashik', 'Maharashtra', '422003', 'Main Market', 'active', '2024-02-01', 5000.00],
      ['GC2024000004', null, 'Amit Patel', 'amit.lpg@email.com', '9812345681', '1992-11-30', '123456789003', 'CDEFG3456H', 'LPG', 'residential', '302, City Heights', 'Near Railway Station', 'Nashik', 'Maharashtra', '422004', 'Near Railway Station', 'active', '2024-02-15', 2000.00]
    ];

    for (const consumer of gasConsumers) {
      await connection.query(`
        INSERT INTO gas_consumers (consumer_number, user_id, full_name, email, phone, date_of_birth, aadhar_number, 
          pan_number, connection_type, consumer_type, address_line1, address_line2, city, state, pincode, landmark, 
          connection_status, connection_date, security_deposit)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE consumer_number=VALUES(consumer_number)
      `, consumer);
    }
    console.log('✓ Sample gas consumers created');

    // Insert sample gas applications
    const gasApplications = [
      ['GNC2024000001', null, 'new_connection', 'PNG', 'pending', 'Amit Sharma', '9876543201', 'amit.sharma@email.com', '{}', '{}', null, null, null],
      ['GNC2024000002', null, 'new_connection', 'LPG', 'approved', 'Sunita Devi', '9876543205', 'sunita.d@email.com', '{}', '{}', null, null, null]
    ];

    for (const app of gasApplications) {
      await connection.query(`
        INSERT INTO gas_applications (application_number, consumer_id, application_type, connection_type, 
          status, applicant_name, applicant_phone, applicant_email, application_data, documents, 
          rejection_reason, remarks, reviewed_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE application_number=VALUES(application_number)
      `, app);
    }
    console.log('✓ Sample gas applications created');

    // Insert sample gas complaints
    const gasComplaints = [
      ['GCP2024000001', 1, 'leakage', 'critical', 'Gas leakage detected in kitchen area', 'Kitchen area', 'open', null, null],
      ['GCP2024000002', 2, 'billing_issue', 'medium', 'Bill amount seems incorrect', 'Bill discrepancy', 'resolved', null, 'Bill corrected']
    ];

    for (const complaint of gasComplaints) {
      await connection.query(`
        INSERT INTO gas_complaints (complaint_number, consumer_id, complaint_type, priority, 
          description, location, status, assigned_to, resolution_notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE complaint_number=VALUES(complaint_number)
      `, complaint);
    }
    console.log('✓ Sample gas complaints created');

    // Insert sample gas cylinder bookings
    const cylinderBookings = [
      ['GCB2024000001', 1, '14.2kg', 1, '2024-02-20', '10:00-12:00', 'pending', '101, Green Valley Apartments, Nashik', 'pending', 'cash_on_delivery', 850.00, null],
      ['GCB2024000002', 2, '14.2kg', 1, '2024-02-18', '14:00-16:00', 'delivered', '205, Sunrise Tower, Nashik', 'paid', 'online', 850.00, null]
    ];

    for (const booking of cylinderBookings) {
      await connection.query(`
        INSERT INTO gas_cylinder_bookings (booking_number, consumer_id, cylinder_type, 
          quantity, delivery_date, delivery_time_slot, status, delivery_address, payment_status, 
          payment_method, amount, remarks)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE booking_number=VALUES(booking_number)
      `, booking);
    }
    console.log('✓ Sample gas cylinder bookings created');

    console.log('\n✅ Gas seeding completed successfully!');
    console.log('\n📝 Login Credentials:');
    console.log('\n🔥 GAS ADMIN LOGIN:');
    console.log('  Username: gas_admin');
    console.log('  Password: GasAdmin@123');
    console.log('  Admin Panel URL: http://localhost:5174/gas/login\n');

  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

seed();
