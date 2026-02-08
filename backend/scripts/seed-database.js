#!/usr/bin/env node

const mysql = require('mysql2');
require('dotenv').config();

// Database connection config
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'suvidha_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const promisePool = pool.promise();

console.log('\n╔════════════════════════════════════════════════╗');
console.log('║    SUVIDHA DATABASE SEEDING - Sample Data     ║');
console.log('╚════════════════════════════════════════════════╝\n');

// Helper function to format dates for MySQL
const formatDateTime = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Sample data generators
const generateCustomers = () => {
  const customers = [];
  
  const stateData = {
    Maharashtra: {
      cities: {
        Mumbai: ['Andheri', 'Bandra', 'Dadar'],
        Pune: ['Aundh', 'Koregaon Park'],
        Nagpur: ['Ratnagiri', 'Sadar']
      }
    },
    Karnataka: {
      cities: {
        Bangalore: ['Whitefield', 'Koramangala'],
        Mysore: ['Vijayanagar']
      }
    }
  };

  const areaPincodes = {
    'Andheri': '400058',
    'Bandra': '400051',
    'Dadar': '400014',
    'Aundh': '411007',
    'Koregaon Park': '411001',
    'Ratnagiri': '440001',
    'Sadar': '440008',
    'Whitefield': '560066',
    'Koramangala': '560034',
    'Vijayanagar': '570005'
  };

  let counter = 0;
  
  for (const [state, cityData] of Object.entries(stateData)) {
    for (const [city, areas] of Object.entries(cityData.cities)) {
      for (const area of areas) {
        for (let i = 1; i <= 5; i++) {
          counter++;
          customers.push({
            id: `ELC${String(counter).padStart(6, '0')}`,
            name: `Customer ${counter}`,
            mobile: `98${String(counter).padStart(8, '0')}`,
            email: `customer${counter}@example.com`,
            password_hash: '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36gZvWFm',
            state: state,
            city: city,
            area: area,
            plot_number: `Plot ${counter}`,
            pincode: areaPincodes[area] || '400001',
            address: `${counter} ${area}, ${city}, ${state}`,
            service_type: 'electricity',
            meter_number: `MTR${String(counter).padStart(6, '0')}`,
            connection_status: 'active',
            connection_date: formatDate(new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000)),
            is_verified: true,
            verification_date: formatDate(new Date()),
          });
        }
      }
    }
  }
  return customers;
};

const generateMeterReadings = (customerIds) => {
  const readings = [];
  const now = new Date();

  customerIds.forEach((customerId, idx) => {
    // Extract number from customer ID for consistent meter number
    const customerNum = String(idx + 1).padStart(6, '0');
    
    // 2 readings per customer (previous and current)
    const prevDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const currDate = new Date();

    const baseReading = 1000 + idx * 10;

    readings.push({
      customer_id: customerId,
      meter_number: `MTR${customerNum}`,
      previous_reading: baseReading,
      current_reading: baseReading + 150 + Math.floor(Math.random() * 100),
      reading_date: formatDate(prevDate),
      reading_type: 'meter_visit',
      status: 'verified',
      submitted_by: 'admin@example.com',
      submitted_at: formatDateTime(prevDate),
    });

    readings.push({
      customer_id: customerId,
      meter_number: `MTR${customerNum}`,
      previous_reading: baseReading + 150 + Math.floor(Math.random() * 100),
      current_reading: baseReading + 300 + Math.floor(Math.random() * 150),
      reading_date: formatDate(currDate),
      reading_type: 'meter_visit',
      status: 'verified',
      submitted_by: 'admin@example.com',
      submitted_at: formatDateTime(currDate),
    });
  });

  return readings;
};

const generateBills = (customerIds) => {
  const bills = [];
  const now = new Date();

  customerIds.forEach((customerId, idx) => {
    const customerNum = String(idx + 1).padStart(6, '0');
    
    // Create bills for last 3 months
    for (let month = 2; month >= 0; month--) {
      const billDate = new Date(now.getFullYear(), now.getMonth() - month, 1);
      const consumption = 100 + Math.floor(Math.random() * 200);

      // Calculate slab-based charges (MSEDCL)
      let charges = 0;
      if (consumption <= 100) {
        charges = consumption * 3.0;
      } else if (consumption <= 300) {
        charges = 100 * 3.0 + (consumption - 100) * 5.2;
      } else if (consumption <= 500) {
        charges = 100 * 3.0 + 200 * 5.2 + (consumption - 300) * 8.45;
      } else {
        charges = 100 * 3.0 + 200 * 5.2 + 200 * 8.45 + (consumption - 500) * 11.5;
      }

      const fixedCharges = 50;
      const taxAmount = (charges + fixedCharges) * 0.12;
      const totalAmount = charges + fixedCharges + taxAmount;

      bills.push({
        customer_id: customerId,
        service_type: 'electricity',
        meter_number: `MTR${customerNum}`,
        billing_period_start: formatDate(new Date(billDate.getFullYear(), billDate.getMonth(), 1)),
        billing_period_end: formatDate(new Date(billDate.getFullYear(), billDate.getMonth() + 1, 0)),
        bill_month: String(billDate.getMonth() + 1).padStart(2, '0'),
        bill_year: billDate.getFullYear(),
        consumption: consumption,
        consumption_charges: charges,
        fixed_charges: fixedCharges,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        bill_status: month === 0 ? 'issued' : 'paid',
        issue_date: formatDate(billDate),
        due_date: formatDate(new Date(billDate.getTime() + 20 * 24 * 60 * 60 * 1000)),
      });
    }
  });

  return bills;
};

const seedDatabase = async () => {
  try {
    console.log('🔄 Seeding database with sample data...\n');

    // Check if data already exists
    const [existing] = await promisePool.query('SELECT COUNT(*) as count FROM customers');
    if (existing[0].count > 1) {
      console.log('⚠️  Database already contains customer data');
      console.log(`   Found ${existing[0].count} customers`);
      console.log('   Skipping seed to avoid duplicates\n');
      console.log('✅ Database ready to use!\n');
      await promisePool.end();
      process.exit(0);
    }

    // Generate data
    const customers = generateCustomers();
    const customerIds = customers.map(c => c.id);

    console.log(`📝 Generated ${customers.length} customers`);
    const readings = generateMeterReadings(customerIds);
    console.log(`📊 Generated ${readings.length} meter readings`);
    const bills = generateBills(customerIds);
    console.log(`💰 Generated ${bills.length} bills\n`);

    // Insert customers
    console.log('Inserting customers...');
    for (const customer of customers) {
      await promisePool.query(
        `INSERT INTO customers 
         (id, name, mobile, email, password_hash, state, city, area, plot_number, pincode, address, 
          service_type, meter_number, connection_status, connection_date, is_verified, verification_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          customer.id,
          customer.name,
          customer.mobile,
          customer.email,
          customer.password_hash,
          customer.state,
          customer.city,
          customer.area,
          customer.plot_number,
          customer.pincode,
          customer.address,
          customer.service_type,
          customer.meter_number,
          customer.connection_status,
          customer.connection_date,
          customer.is_verified,
          customer.verification_date,
        ]
      );
    }
    console.log(`✅ Inserted ${customers.length} customers\n`);

    // Insert meter readings
    console.log('Inserting meter readings...');
    for (const reading of readings) {
      await promisePool.query(
        `INSERT INTO meter_readings 
         (customer_id, meter_number, previous_reading, current_reading, reading_date, 
          reading_type, status, submitted_by, submitted_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          reading.customer_id,
          reading.meter_number,
          reading.previous_reading,
          reading.current_reading,
          reading.reading_date,
          reading.reading_type,
          reading.status,
          reading.submitted_by,
          reading.submitted_at,
        ]
      );
    }
    console.log(`✅ Inserted ${readings.length} meter readings\n`);

    // Insert bills
    console.log('Inserting bills...');
    for (const bill of bills) {
      await promisePool.query(
        `INSERT INTO bills 
         (customer_id, service_type, meter_number, billing_period_start, billing_period_end,
          bill_month, bill_year, consumption, consumption_charges, fixed_charges, tax_amount,
          total_amount, bill_status, issue_date, due_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          bill.customer_id,
          bill.service_type,
          bill.meter_number,
          bill.billing_period_start,
          bill.billing_period_end,
          bill.bill_month,
          bill.bill_year,
          bill.consumption,
          bill.consumption_charges,
          bill.fixed_charges,
          bill.tax_amount,
          bill.total_amount,
          bill.bill_status,
          bill.issue_date,
          bill.due_date,
        ]
      );
    }
    console.log(`✅ Inserted ${bills.length} bills\n`);

    console.log('═'.repeat(50));
    console.log('✅ DATABASE SEEDING COMPLETE!\n');
    console.log('📊 Sample Data Created:');
    console.log(`   • ${customers.length} Customers`);
    console.log(`   • ${readings.length} Meter Readings`);
    console.log(`   • ${bills.length} Bills`);
    console.log('');
    console.log('🎯 Ready to test:');
    console.log('   1. Login to admin: admin@example.com');
    console.log('   2. Go to Meter Readings');
    console.log('   3. Filter: Maharashtra > Mumbai > Andheri > 400058');
    console.log('   4. See 8 customers with readings & bills');
    console.log('');

    await promisePool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    await promisePool.end();
    process.exit(1);
  }
};

seedDatabase();
