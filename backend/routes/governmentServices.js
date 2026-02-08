/**
 * Government Services Routes
 * Example routes demonstrating how to fetch government utility data
 */

const express = require('express');
const router = express.Router();
const governmentServicesAPI = require('../utils/governmentServicesAPI');

/**
 * WATER SERVICE ROUTES
 */

// Get water bills for a consumer (last 3 months)
router.get('/water/bills/:consumerId', async (req, res) => {
  try {
    const { consumerId } = req.params;
    const { state, months } = req.query;

    if (!state) {
      return res.status(400).json({ error: 'State parameter is required' });
    }

    const bills = await governmentServicesAPI.getWaterBills(
      consumerId,
      state,
      parseInt(months) || 3
    );

    res.json({
      success: true,
      data: bills,
      message: `Water bills retrieved for consumer ${consumerId}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get water tariff for a state
router.get('/water/tariff/:state', async (req, res) => {
  try {
    const { state } = req.params;
    const tariff = await governmentServicesAPI.getWaterTariff(state);

    res.json({
      success: true,
      data: tariff,
      message: `Water tariff retrieved for state ${state}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get all states with water service
router.get('/water/states', async (req, res) => {
  try {
    const states = await governmentServicesAPI.getWaterStates();

    res.json({
      success: true,
      data: states,
      message: 'All water service states retrieved'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GAS SERVICE ROUTES
 */

// Get gas prices for a state
router.get('/gas/prices/:state', async (req, res) => {
  try {
    const { state } = req.params;
    const prices = await governmentServicesAPI.getGasPrices(state);

    res.json({
      success: true,
      data: prices,
      message: `Gas prices retrieved for state ${state}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get gas price for a specific region
router.get('/gas/price/:state/:region', async (req, res) => {
  try {
    const { state, region } = req.params;
    const price = await governmentServicesAPI.getGasPriceByRegion(state, region);

    res.json({
      success: true,
      data: price,
      message: `Gas price retrieved for ${region}, ${state}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get all states with gas service
router.get('/gas/states', async (req, res) => {
  try {
    const states = await governmentServicesAPI.getGasStates();

    res.json({
      success: true,
      data: states,
      message: 'All gas service states retrieved'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * ELECTRICITY SERVICE ROUTES
 */

// Get electricity bills for a consumer (last 3 months)
router.get('/electricity/bills/:consumerId', async (req, res) => {
  try {
    const { consumerId } = req.params;
    const { category, months } = req.query;

    if (!category) {
      return res.status(400).json({ error: 'Category parameter is required' });
    }

    const bills = await governmentServicesAPI.getElectricityBills(
      consumerId,
      category,
      parseInt(months) || 3
    );

    res.json({
      success: true,
      data: bills,
      message: `Electricity bills retrieved for consumer ${consumerId}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get electricity consumer categories
router.get('/electricity/categories', async (req, res) => {
  try {
    const categories = await governmentServicesAPI.getElectricityCategories();

    res.json({
      success: true,
      data: categories,
      message: 'Electricity categories retrieved'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get electricity tariff for a category
router.get('/electricity/tariff/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const tariff = await governmentServicesAPI.getElectricityTariff(category);

    res.json({
      success: true,
      data: tariff,
      message: `Electricity tariff retrieved for category ${category}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * COMBINED SERVICE ROUTES
 */

// Get all states for all services
router.get('/all-services/states', async (req, res) => {
  try {
    const states = await governmentServicesAPI.getAllServicesStates();

    res.json({
      success: true,
      data: states,
      message: 'All service states retrieved'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get consumer bill history across all services
router.get('/consumer/:consumerId/history', async (req, res) => {
  try {
    const { consumerId } = req.params;
    const { state, serviceType } = req.query;

    if (!state) {
      return res.status(400).json({ error: 'State parameter is required' });
    }

    const history = await governmentServicesAPI.getConsumerBillHistory(
      consumerId,
      state,
      serviceType || 'all'
    );

    res.json({
      success: true,
      data: history,
      message: `Bill history retrieved for consumer ${consumerId}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * HEALTH CHECK ROUTE
 */

router.get('/health', async (req, res) => {
  try {
    const health = await governmentServicesAPI.healthCheck();

    res.json({
      success: true,
      data: health,
      message: 'Dummy API is healthy'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Dummy API is not available'
    });
  }
});

module.exports = router;
