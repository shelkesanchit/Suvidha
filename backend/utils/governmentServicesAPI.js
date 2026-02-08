/**
 * Government Services API Integration Utility
 * Integrates with SUVIDHA Dummy API to fetch government utility data
 */

const axios = require('axios');

class GovernmentServicesAPI {
  constructor() {
    this.baseURL = process.env.DUMMY_API_BASE_URL || 'http://localhost:8000/api';
    this.timeout = parseInt(process.env.API_TIMEOUT) || 30000;

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * WATER SERVICE ENDPOINTS
   */

  async getWaterBills(consumerId, state, months = 3) {
    try {
      const response = await this.client.get('/water/bills/' + consumerId, {
        params: {
          state,
          months
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch water bills: ${error.message}`);
    }
  }

  async getWaterTariff(state) {
    try {
      const response = await this.client.get('/water/tariff/' + state);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch water tariff: ${error.message}`);
    }
  }

  async getWaterStates() {
    try {
      const response = await this.client.get('/water/states');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch water states: ${error.message}`);
    }
  }

  /**
   * GAS SERVICE ENDPOINTS
   */

  async getGasPrices(state) {
    try {
      const response = await this.client.get('/gas/prices/' + state);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch gas prices: ${error.message}`);
    }
  }

  async getGasPriceByRegion(state, region) {
    try {
      const response = await this.client.get(`/gas/price/${state}/${region}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch gas price: ${error.message}`);
    }
  }

  async getGasStates() {
    try {
      const response = await this.client.get('/gas/states');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch gas states: ${error.message}`);
    }
  }

  /**
   * ELECTRICITY SERVICE ENDPOINTS
   */

  async getElectricityBills(consumerId, category, months = 3) {
    try {
      const response = await this.client.get('/electricity/bills/' + consumerId, {
        params: {
          category,
          months
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch electricity bills: ${error.message}`);
    }
  }

  async getElectricityCategories() {
    try {
      const response = await this.client.get('/electricity/categories');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch electricity categories: ${error.message}`);
    }
  }

  async getElectricityTariff(category) {
    try {
      const response = await this.client.get('/electricity/tariff/' + category);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch electricity tariff: ${error.message}`);
    }
  }

  /**
   * COMBINED SERVICE ENDPOINTS
   */

  async getAllServicesStates() {
    try {
      const response = await this.client.get('/all-services/states');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch all services states: ${error.message}`);
    }
  }

  async getConsumerBillHistory(consumerId, state, serviceType = 'all') {
    try {
      const response = await this.client.get(`/consumer/${consumerId}/history`, {
        params: {
          state,
          service_type: serviceType
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch consumer bill history: ${error.message}`);
    }
  }

  /**
   * Health Check
   */

  async healthCheck() {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error) {
      throw new Error(`Health check failed: ${error.message}`);
    }
  }
}

module.exports = new GovernmentServicesAPI();
