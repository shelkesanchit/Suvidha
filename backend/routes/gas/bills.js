const express = require('express');
const router = express.Router();
const { promisePool } = require('../../config/database');

// =====================================================
// GAS BILLS ROUTES
// NOTE: No gas_bills table exists. Gas billing is LPG cylinder-based.
// This module works with gas_cylinder_bookings + gas_tariff_rates
// to provide billing info to the frontend.
// =====================================================

// Fetch pending charges / outstanding bookings for a customer
router.get('/fetch/:consumerId', async (req, res) => {
  try {
    const { consumerId } = req.params;

    // Get customer details from gas_customers (not gas_consumers)
    const [customers] = await promisePool.query(
      'SELECT * FROM gas_customers WHERE consumer_id = ?',
      [consumerId]
    );

    if (customers.length === 0) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const customer = customers[0];

    // Get pending cylinder bookings (unpaid)
    const [bookings] = await promisePool.query(
      `SELECT * FROM gas_cylinder_bookings 
       WHERE customer_id = ? AND payment_status != 'paid'
       ORDER BY booking_date DESC
       LIMIT 1`,
      [customer.id]
    );

    // Get tariff rate for customer's cylinder type and area
    const [tariffs] = await promisePool.query(
      `SELECT * FROM gas_tariff_rates 
       WHERE state = ? AND city = ? AND cylinder_type = ?
       ORDER BY effective_from DESC
       LIMIT 1`,
      [customer.state, customer.city, customer.cylinder_type || '14kg']
    );

    let billData;
    if (bookings.length > 0) {
      const booking = bookings[0];
      billData = {
        booking_number: booking.booking_number,
        consumer_id: customer.consumer_id,
        customer_name: customer.full_name,
        address: customer.address,
        cylinder_type: booking.cylinder_type,
        quantity: booking.quantity,
        booking_date: booking.booking_date,
        delivery_date: booking.delivery_date,
        total_amount: booking.total_amount,
        payment_status: booking.payment_status,
        status: 'Unpaid'
      };
    } else {
      // No pending bookings - show tariff info
      const tariff = tariffs.length > 0 ? tariffs[0] : null;
      billData = {
        consumer_id: customer.consumer_id,
        customer_name: customer.full_name,
        address: customer.address,
        cylinder_type: customer.cylinder_type || '14kg',
        price_per_cylinder: tariff ? tariff.price_per_cylinder : 0,
        subsidy_amount: tariff ? tariff.subsidy_amount : 0,
        message: 'No pending bookings found',
        status: 'No dues'
      };
    }

    res.json({
      success: true,
      data: {
        customer: {
          consumer_id: customer.consumer_id,
          full_name: customer.full_name,
          address: customer.address,
          lpg_consumer_id: customer.lpg_consumer_id,
          cylinder_type: customer.cylinder_type,
          connection_type: customer.connection_type,
          connection_status: customer.connection_status
        },
        bill: billData
      }
    });

  } catch (error) {
    console.error('Fetch gas bill error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get billing/payment history
router.get('/history/:consumerId', async (req, res) => {
  try {
    const { consumerId } = req.params;

    // Look up customer
    const [customers] = await promisePool.query(
      'SELECT id FROM gas_customers WHERE consumer_id = ?',
      [consumerId]
    );

    if (customers.length === 0) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    // Get payment history joined with bookings
    const [payments] = await promisePool.query(
      `SELECT gp.transaction_id, gp.amount, gp.subsidy_amount, gp.payment_method,
              gp.payment_status, gp.receipt_number, gp.payment_date,
              cb.booking_number, cb.cylinder_type, cb.quantity
       FROM gas_payments gp
       LEFT JOIN gas_cylinder_bookings cb ON gp.booking_id = cb.id
       WHERE gp.customer_id = ?
       ORDER BY gp.payment_date DESC
       LIMIT 12`,
      [customers[0].id]
    );

    res.json({ success: true, data: payments });

  } catch (error) {
    console.error('Get bill history error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Calculate cylinder price
router.post('/calculate', async (req, res) => {
  try {
    const { consumer_id, cylinder_type, quantity } = req.body;

    // Get customer from gas_customers
    const [customers] = await promisePool.query(
      'SELECT * FROM gas_customers WHERE consumer_id = ?',
      [consumer_id]
    );

    if (customers.length === 0) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const customer = customers[0];
    const cylType = cylinder_type || customer.cylinder_type || '14kg';
    const qty = quantity || 1;

    // Get tariff rate
    let [tariffs] = await promisePool.query(
      `SELECT * FROM gas_tariff_rates 
       WHERE state = ? AND city = ? AND cylinder_type = ?
       ORDER BY effective_from DESC
       LIMIT 1`,
      [customer.state, customer.city, cylType]
    );

    if (tariffs.length === 0) {
      // Fallback: get any tariff for this cylinder type
      [tariffs] = await promisePool.query(
        `SELECT * FROM gas_tariff_rates 
         WHERE cylinder_type = ?
         ORDER BY effective_from DESC
         LIMIT 1`,
        [cylType]
      );

      if (tariffs.length === 0) {
        return res.status(404).json({ success: false, message: 'Tariff rate not found for this cylinder type' });
      }
    }

    const tariff = tariffs[0];
    const pricePerCylinder = parseFloat(tariff.price_per_cylinder);
    const subsidyAmount = parseFloat(tariff.subsidy_amount || 0);
    const basePrice = parseFloat(tariff.base_price || pricePerCylinder);

    // PMUY and domestic connections get subsidy
    const isSubsidyEligible = customer.connection_type === 'pmuy' || customer.connection_type === 'domestic';
    const effectiveSubsidy = isSubsidyEligible ? subsidyAmount : 0;

    const totalAmount = (pricePerCylinder - effectiveSubsidy) * qty;

    res.json({
      success: true,
      data: {
        consumer_id: consumer_id,
        cylinder_type: cylType,
        quantity: qty,
        base_price: basePrice,
        price_per_cylinder: pricePerCylinder,
        subsidy_amount: effectiveSubsidy,
        effective_price: pricePerCylinder - effectiveSubsidy,
        total_amount: parseFloat(totalAmount.toFixed(2)),
        supplier: tariff.supplier
      }
    });

  } catch (error) {
    console.error('Calculate bill error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
