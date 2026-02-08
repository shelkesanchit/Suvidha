const { promisePool: pool } = require('../../config/database');

// Get all consumer accounts
const getAllCustomers = async (req, res) => {
  try {
    const { state, city, pincode } = req.query;

    let query = `
      SELECT ca.id, ca.consumer_number, ca.meter_number, ca.category, 
             ca.connection_status, ca.address_line1, ca.city, ca.state, ca.pincode,
             u.full_name AS name, u.email, u.phone AS mobile,
             mr.reading_value AS previousReading,
             mr.reading_date AS lastReadingDate
      FROM electricity_consumer_accounts ca
      LEFT JOIN electricity_users u ON ca.user_id = u.id
      LEFT JOIN (
        SELECT consumer_account_id, reading_value, reading_date
        FROM electricity_meter_readings
        WHERE id IN (
          SELECT MAX(id) FROM electricity_meter_readings GROUP BY consumer_account_id
        )
      ) mr ON ca.id = mr.consumer_account_id
      WHERE ca.connection_status = 'active'
    `;
    const params = [];

    if (state) {
      query += ' AND ca.state = ?';
      params.push(state);
    }
    if (city) {
      query += ' AND ca.city = ?';
      params.push(city);
    }
    if (pincode) {
      query += ' AND ca.pincode = ?';
      params.push(pincode);
    }

    query += ' ORDER BY ca.id';

    const [customers] = await pool.query(query, params);

    // Format response
    const formatted = customers.map(c => ({
      ...c,
      previousReading: c.previousReading ? Number(c.previousReading) : 0,
      lastReadingDate: c.lastReadingDate
        ? new Date(c.lastReadingDate).toISOString().split('T')[0]
        : null,
      connectionType: c.category ? c.category.charAt(0).toUpperCase() + c.category.slice(1) : 'Residential',
    }));

    res.json({
      success: true,
      data: formatted,
      total: formatted.length,
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Helper: calculate bill from tariff rates or fallback
async function calculateBill(consumption, consumerId) {
  try {
    // Get consumer account details
    const [accounts] = await pool.query(
      'SELECT state, city, category FROM electricity_consumer_accounts WHERE id = ?',
      [consumerId]
    );
    if (accounts.length === 0) {
      const total = consumption * 8.0;
      return { consumptionCharges: total, fixedCharges: 0, taxAmount: 0, totalAmount: total, category: 'residential' };
    }
    const { state, city, category } = accounts[0];

    // Look up tariff rates
    const [rates] = await pool.query(
      `SELECT slab_from, slab_to, rate_per_unit, fixed_charge, tax_percentage
       FROM electricity_tariff_rates
       WHERE state = ? AND city = ? AND category = ?
       ORDER BY slab_from ASC`,
      [state, city, category]
    );

    if (rates.length === 0) {
      // No tariff found, use flat rate
      const total = consumption * 8.0;
      return { consumptionCharges: total, fixedCharges: 0, taxAmount: 0, totalAmount: total, category };
    }

    let consumptionCharges = 0;
    let remaining = consumption;
    let fixedCharges = rates[0].fixed_charge ? Number(rates[0].fixed_charge) : 0;
    let taxPercentage = rates[0].tax_percentage ? Number(rates[0].tax_percentage) : 0;

    for (const slab of rates) {
      const slabFrom = slab.slab_from || 0;
      const slabTo = slab.slab_to || Infinity;
      const slabSize = slabTo - slabFrom;
      const ratePerUnit = Number(slab.rate_per_unit);

      if (remaining <= 0) break;

      const unitsInSlab = Math.min(remaining, slabSize);
      consumptionCharges += unitsInSlab * ratePerUnit;
      remaining -= unitsInSlab;
    }

    consumptionCharges = Math.round(consumptionCharges * 100) / 100;
    const taxAmount = Math.round((consumptionCharges + fixedCharges) * (taxPercentage / 100) * 100) / 100;
    const totalAmount = Math.round((consumptionCharges + fixedCharges + taxAmount) * 100) / 100;

    return { consumptionCharges, fixedCharges, taxAmount, totalAmount, category };
  } catch (err) {
    console.error('Tariff calculation error, using fallback:', err.message);
    const total = consumption * 8.0;
    return { consumptionCharges: total, fixedCharges: 0, taxAmount: 0, totalAmount: total, category: 'domestic' };
  }
}

// Helper: generate bill number
function generateBillNumber(customerId, readingDate) {
  const d = new Date(readingDate);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `BILL-${customerId}-${year}${month}`;
}

// Helper: create bill in electricity_bills table
async function createBill(customerId, meterNumber, consumption, billData, readingDate) {
  const d = new Date(readingDate);
  const billMonth = d.getMonth() + 1;
  const billYear = d.getFullYear();
  const billNumber = generateBillNumber(customerId, readingDate);

  // Billing period: from 1st of the month to the reading date
  const periodStart = `${billYear}-${String(billMonth).padStart(2, '0')}-01`;
  const periodEnd = readingDate;

  // Due date: 15 days after issue
  const dueDate = new Date(d.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Check if bill already exists for this customer/month/year
  const [existing] = await pool.query(
    'SELECT id FROM electricity_bills WHERE customer_id = ? AND bill_month = ? AND bill_year = ?',
    [customerId, billMonth, billYear]
  );

  if (existing.length > 0) {
    // Update existing bill
    await pool.query(
      `UPDATE electricity_bills SET
        meter_number = ?, units_consumed = ?, slab_category = ?,
        consumption_charges = ?, fixed_charges = ?, tax_amount = ?,
        total_amount = ?, billing_period_start = ?, billing_period_end = ?,
        issue_date = ?, due_date = ?, bill_status = 'issued'
       WHERE customer_id = ? AND bill_month = ? AND bill_year = ?`,
      [meterNumber, consumption, billData.category,
       billData.consumptionCharges, billData.fixedCharges, billData.taxAmount,
       billData.totalAmount, periodStart, periodEnd,
       readingDate, dueDate,
       customerId, billMonth, billYear]
    );
    return existing[0].id;
  }

  // Insert new bill
  const [result] = await pool.query(
    `INSERT INTO electricity_bills
     (bill_number, customer_id, meter_number, billing_period_start, billing_period_end,
      bill_month, bill_year, units_consumed, slab_category,
      consumption_charges, fixed_charges, tax_amount, total_amount,
      bill_status, issue_date, due_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'issued', ?, ?)`,
    [billNumber, customerId, meterNumber, periodStart, periodEnd,
     billMonth, billYear, consumption, billData.category,
     billData.consumptionCharges, billData.fixedCharges, billData.taxAmount,
     billData.totalAmount, readingDate, dueDate]
  );
  return result.insertId;
}

// Submit single meter reading
const submitMeterReading = async (req, res) => {
  try {
    const { customerId, currentReading, previousReading, readingDate, meterNumber } = req.body;

    // Validate reading
    if (currentReading <= previousReading) {
      return res.status(400).json({
        success: false,
        message: 'Current reading must be greater than previous reading',
      });
    }

    const consumption = currentReading - previousReading;

    // Calculate bill from tariff rates
    const billData = await calculateBill(consumption, customerId);

    // Save meter reading to database
    await pool.query(
      `INSERT INTO electricity_meter_readings 
       (customer_id, meter_number, reading_date, previous_reading, current_reading, units_consumed, 
        reading_type, status, submitted_by)
       VALUES (?, ?, ?, ?, ?, ?, 'meter_visit', 'verified', ?)`,
      [customerId, meterNumber, readingDate, previousReading, currentReading, consumption,
       req.user?.name || 'Admin']
    );

    // Create bill in electricity_bills table
    await createBill(customerId, meterNumber, consumption, billData, readingDate);

    res.json({
      success: true,
      message: 'Meter reading submitted and bill generated successfully',
      data: {
        customerId,
        meterNumber,
        consumption,
        calculatedBill: billData.totalAmount,
        readingDate,
        previousReading,
        currentReading,
      },
    });
  } catch (error) {
    console.error('Error submitting meter reading:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Submit bulk meter readings
const submitBulkMeterReadings = async (req, res) => {
  try {
    const { readings } = req.body;

    if (!readings || !Array.isArray(readings) || readings.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No readings provided',
      });
    }

    const results = [];
    const errors = [];

    for (const reading of readings) {
      try {
        if (reading.currentReading <= reading.previousReading) {
          errors.push({
            customerId: reading.customerId,
            error: 'Current reading must be greater than previous reading',
          });
          continue;
        }

        const consumption = reading.currentReading - reading.previousReading;
        const billData = await calculateBill(consumption, reading.customerId);

        // Save to database
        await pool.query(
          `INSERT INTO electricity_meter_readings 
           (customer_id, meter_number, reading_date, previous_reading, current_reading, units_consumed,
            reading_type, status, submitted_by)
           VALUES (?, ?, ?, ?, ?, ?, 'meter_visit', 'verified', ?)`,
          [reading.customerId, reading.meterNumber, reading.readingDate,
           reading.previousReading, reading.currentReading, consumption,
           req.user?.name || 'Admin']
        );

        // Create bill
        await createBill(reading.customerId, reading.meterNumber, consumption, billData, reading.readingDate);

        results.push({
          customerId: reading.customerId,
          meterNumber: reading.meterNumber,
          consumption,
          calculatedBill: billData.totalAmount,
          readingDate: reading.readingDate,
          previousReading: reading.previousReading,
          currentReading: reading.currentReading,
          status: 'success',
        });
      } catch (err) {
        errors.push({
          customerId: reading.customerId,
          error: err.message,
        });
      }
    }

    res.json({
      success: true,
      message: `${results.length} readings submitted successfully${errors.length > 0 ? `, ${errors.length} errors` : ''}`,
      data: {
        successful: results,
        failed: errors,
        totalProcessed: results.length + errors.length,
        successCount: results.length,
        errorCount: errors.length,
      },
    });
  } catch (error) {
    console.error('Error submitting bulk readings:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get meter reading history from database
const getMeterReadingHistory = async (req, res) => {
  try {
    const { customerId } = req.params;

    const [history] = await pool.query(
      `SELECT mr.id, mr.customer_id AS customerId, 
              mr.current_reading AS reading,
              mr.reading_date AS date,
              mr.units_consumed AS consumption,
              COALESCE(b.total_amount, mr.units_consumed * 8.0) AS bill
       FROM electricity_meter_readings mr
       LEFT JOIN electricity_bills b ON b.customer_id = mr.customer_id 
         AND b.bill_month = MONTH(mr.reading_date)
         AND b.bill_year = YEAR(mr.reading_date)
       WHERE mr.customer_id = ?
       ORDER BY mr.reading_date DESC
       LIMIT 12`,
      [customerId]
    );

    // Format dates
    const formatted = history.map(h => ({
      ...h,
      reading: Number(h.reading),
      consumption: Number(h.consumption),
      bill: Number(h.bill),
      date: h.date ? new Date(h.date).toISOString().split('T')[0] : null,
    }));

    res.json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    console.error('Error fetching meter reading history:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getAllCustomers,
  submitMeterReading,
  submitBulkMeterReadings,
  getMeterReadingHistory,
};
