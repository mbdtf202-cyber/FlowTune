/**
 * MoonPay Service
 * Handles fiat currency to cryptocurrency purchase integration
 * Note: This is a demo version using mock data
 */

import crypto from 'crypto';
import logger from '../utils/logger.js';

class MoonPayService {
  constructor() {
    this.apiKey = process.env.MOONPAY_API_KEY || 'demo_api_key';
    this.secretKey = process.env.MOONPAY_SECRET_KEY || 'demo_secret_key';
    this.baseURL = process.env.MOONPAY_BASE_URL || 'https://api.moonpay.com';
    this.isDemo = process.env.NODE_ENV !== 'production' || !process.env.MOONPAY_API_KEY;
    
    // Supported currency configuration
    this.supportedCurrencies = {
      fiat: ['USD', 'EUR', 'GBP', 'CNY', 'JPY'],
      crypto: ['FLOW', 'ETH', 'BTC', 'USDC']
    };

    // Mock data for demo mode
    this.demoTransactions = new Map();
    this.demoRates = {
      'USD_FLOW': 0.85,
      'EUR_FLOW': 0.92,
      'GBP_FLOW': 1.05,
      'CNY_FLOW': 0.12,
      'JPY_FLOW': 0.0065
    };
  }

  /**
   * Get supported currencies list
   */
  async getSupportedCurrencies() {
    try {
      if (this.isDemo) {
        return {
          success: true,
          data: this.supportedCurrencies,
          demo: true
        };
      }

      // 实际API调用
      const response = await this.makeRequest('/v3/currencies');
      return {
        success: true,
        data: response
      };
    } catch (error) {
      logger.error('Failed to get supported currencies:', error);
      throw new Error('Unable to get supported currencies list');
    }
  }

  /**
   * Get real-time exchange rates
   */
  async getExchangeRates(baseCurrency = 'USD', quoteCurrency = 'FLOW') {
    try {
      const rateKey = `${baseCurrency}_${quoteCurrency}`;
      
      if (this.isDemo) {
        const rate = this.demoRates[rateKey] || 1.0;
        return {
          success: true,
          data: {
            baseCurrency,
            quoteCurrency,
            rate,
            timestamp: Date.now(),
            demo: true
          }
        };
      }

      // 实际API调用
      const response = await this.makeRequest(`/v3/currencies/${quoteCurrency}/price`, {
        baseCurrencyCode: baseCurrency
      });

      return {
        success: true,
        data: response
      };
    } catch (error) {
      logger.error('Failed to get exchange rates:', error);
      throw new Error('Unable to get current exchange rates');
    }
  }

  /**
   * Create purchase order
   */
  async createBuyOrder(orderData) {
    try {
      const {
        baseCurrency,
        baseCurrencyAmount,
        quoteCurrency,
        walletAddress,
        userEmail,
        redirectURL
      } = orderData;

      if (this.isDemo) {
        const orderId = this.generateOrderId();
        const rate = this.demoRates[`${baseCurrency}_${quoteCurrency}`] || 1.0;
        const quoteCurrencyAmount = baseCurrencyAmount * rate;

        const order = {
          id: orderId,
          status: 'pending',
          baseCurrency,
          baseCurrencyAmount: parseFloat(baseCurrencyAmount),
          quoteCurrency,
          quoteCurrencyAmount: parseFloat(quoteCurrencyAmount.toFixed(6)),
          walletAddress,
          userEmail,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // Expires in 30 minutes
          paymentURL: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/${orderId}`,
          demo: true
        };

        this.demoTransactions.set(orderId, order);

        return {
          success: true,
          data: order
        };
      }

      // 实际API调用
      const response = await this.makeRequest('/v1/transactions', {
        method: 'POST',
        body: {
          baseCurrency,
          baseCurrencyAmount,
          quoteCurrency,
          walletAddress,
          email: userEmail,
          redirectURL
        }
      });

      return {
        success: true,
        data: response
      };
    } catch (error) {
      logger.error('Failed to create purchase order:', error);
      throw new Error('Unable to create purchase order');
    }
  }

  /**
   * Get order status
   */
  async getOrderStatus(orderId) {
    try {
      if (this.isDemo) {
        const order = this.demoTransactions.get(orderId);
        if (!order) {
          throw new Error('Order does not exist');
        }

        // Simulate order status changes
        const now = Date.now();
        const createdAt = new Date(order.createdAt).getTime();
        const elapsed = now - createdAt;

        if (elapsed > 30 * 60 * 1000) { // Expires after 30 minutes
          order.status = 'expired';
        } else if (elapsed > 5 * 60 * 1000) { // Completes after 5 minutes
          order.status = 'completed';
          order.transactionHash = this.generateTransactionHash();
        } else if (elapsed > 2 * 60 * 1000) { // Processing after 2 minutes
          order.status = 'processing';
        }

        return {
          success: true,
          data: order
        };
      }

      // 实际API调用
      const response = await this.makeRequest(`/v1/transactions/${orderId}`);
      return {
        success: true,
        data: response
      };
    } catch (error) {
      logger.error('Failed to get order status:', error);
      throw new Error('Unable to get order status');
    }
  }

  /**
   * Get user's purchase history
   */
  async getUserPurchaseHistory(userEmail, limit = 10) {
    try {
      if (this.isDemo) {
        const userOrders = Array.from(this.demoTransactions.values())
          .filter(order => order.userEmail === userEmail)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, limit);

        return {
          success: true,
          data: {
            orders: userOrders,
            total: userOrders.length,
            demo: true
          }
        };
      }

      // Actual API call
      const response = await this.makeRequest('/v1/transactions', {
        email: userEmail,
        limit
      });

      return {
        success: true,
        data: response
      };
    } catch (error) {
      logger.error('Failed to get purchase history:', error);
      throw new Error('Unable to get purchase history');
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload, signature) {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.secretKey)
        .update(payload)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch (error) {
      logger.error('Failed to verify webhook signature:', error);
      return false;
    }
  }

  /**
   * Handle webhook events
   */
  async handleWebhook(payload, signature) {
    try {
      if (!this.isDemo && !this.verifyWebhookSignature(payload, signature)) {
        throw new Error('Invalid webhook signature');
      }

      const event = JSON.parse(payload);
      logger.info('Received MoonPay webhook event:', event);

      // Handle different types of events
      switch (event.type) {
        case 'transaction_updated':
          await this.handleTransactionUpdate(event.data);
          break;
        case 'transaction_completed':
          await this.handleTransactionCompleted(event.data);
          break;
        case 'transaction_failed':
          await this.handleTransactionFailed(event.data);
          break;
        default:
          logger.warn('Unknown webhook event type:', event.type);
      }

      return { success: true };
    } catch (error) {
      logger.error('Failed to handle webhook:', error);
      throw error;
    }
  }

  /**
   * Handle transaction update events
   */
  async handleTransactionUpdate(transactionData) {
    logger.info('Transaction status updated:', transactionData);
    // Here you can update order status in database
    // Send notifications to users, etc.
  }

  /**
   * Handle transaction completed events
   */
  async handleTransactionCompleted(transactionData) {
    logger.info('Transaction completed:', transactionData);
    // Here you can trigger NFT minting or other follow-up operations
  }

  /**
   * Handle transaction failed events
   */
  async handleTransactionFailed(transactionData) {
    logger.info('Transaction failed:', transactionData);
    // Here you can handle failure logic, such as refunds, notifications, etc.
  }

  /**
   * Make API request
   */
  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      method: options.method || 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    if (options.body) {
      config.body = JSON.stringify(options.body);
    }

    if (options.method === 'GET' && options.params) {
      const searchParams = new URLSearchParams(options.params);
      url += `?${searchParams.toString()}`;
    }

    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`MoonPay API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Generate order ID
   */
  generateOrderId() {
    return `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate transaction hash
   */
  generateTransactionHash() {
    return `0x${crypto.randomBytes(32).toString('hex')}`;
  }

  /**
   * Get service status
   */
  getServiceStatus() {
    return {
      isDemo: this.isDemo,
      supportedCurrencies: this.supportedCurrencies,
      activeTransactions: this.demoTransactions.size,
      lastUpdate: new Date().toISOString()
    };
  }
}

export default new MoonPayService();