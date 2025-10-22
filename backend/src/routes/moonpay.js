/**
 * MoonPay Routes
 * 处理法币购买加密货币的API路由
 */

import express from 'express';
import rateLimit from 'express-rate-limit';
import { authenticateToken } from '../middleware/auth.js';
import moonPayService from '../services/moonPayService.js';
import logger from '../utils/logger.js';

const router = express.Router();

// 限流中间件
const moonPayLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 50, // 每个IP最多50次请求
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: 15 * 60
  }
});

// 创建订单的限流（更严格）
const createOrderLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 5, // 每分钟最多5次创建订单
  message: {
    error: 'Too many order creation attempts, please try again later.',
    retryAfter: 60
  }
});

// 应用限流中间件
router.use(moonPayLimiter);

/**
 * GET /api/moonpay/currencies
 * 获取支持的货币列表
 */
router.get('/currencies', async (req, res) => {
  try {
    const result = await moonPayService.getSupportedCurrencies();
    res.json(result);
  } catch (error) {
    logger.error('获取支持货币失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/moonpay/rates
 * 获取实时汇率
 */
router.get('/rates', async (req, res) => {
  try {
    const { baseCurrency = 'USD', quoteCurrency = 'FLOW' } = req.query;
    
    const result = await moonPayService.getExchangeRates(baseCurrency, quoteCurrency);
    res.json(result);
  } catch (error) {
    logger.error('获取汇率失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/moonpay/orders
 * 创建购买订单
 */
router.post('/orders', createOrderLimiter, authenticateToken, async (req, res) => {
  try {
    const {
      baseCurrency,
      baseCurrencyAmount,
      quoteCurrency = 'FLOW',
      walletAddress
    } = req.body;

    // 验证必需参数
    if (!baseCurrency || !baseCurrencyAmount || !walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: baseCurrency, baseCurrencyAmount, walletAddress'
      });
    }

    // 验证金额
    const amount = parseFloat(baseCurrencyAmount);
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid purchase amount'
      });
    }

    // 验证金额范围（演示版本限制）
    if (amount < 10 || amount > 10000) {
      return res.status(400).json({
        success: false,
        error: '购买金额必须在 $10 - $10,000 之间'
      });
    }

    const orderData = {
      baseCurrency,
      baseCurrencyAmount: amount,
      quoteCurrency,
      walletAddress,
      userEmail: req.user.email,
      redirectURL: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/success`
    };

    const result = await moonPayService.createBuyOrder(orderData);
    
    logger.info('创建MoonPay订单:', {
      orderId: result.data.id,
      userId: req.user.id,
      amount: amount,
      currency: baseCurrency
    });

    res.json(result);
  } catch (error) {
    logger.error('创建订单失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/moonpay/orders/:orderId
 * 获取订单状态
 */
router.get('/orders/:orderId', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const result = await moonPayService.getOrderStatus(orderId);
    res.json(result);
  } catch (error) {
    logger.error('获取订单状态失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/moonpay/history
 * 获取用户购买历史
 */
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const userEmail = req.user.email;
    
    const result = await moonPayService.getUserPurchaseHistory(userEmail, parseInt(limit));
    res.json(result);
  } catch (error) {
    logger.error('获取购买历史失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/moonpay/webhook
 * 处理MoonPay webhook
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['moonpay-signature'];
    const payload = req.body.toString();
    
    await moonPayService.handleWebhook(payload, signature);
    
    res.status(200).json({ success: true });
  } catch (error) {
    logger.error('处理webhook失败:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/moonpay/status
 * 获取MoonPay服务状态
 */
router.get('/status', async (req, res) => {
  try {
    const status = moonPayService.getServiceStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('获取服务状态失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/moonpay/demo/simulate/:orderId/:status
 * 演示模式：模拟订单状态变化
 */
router.get('/demo/simulate/:orderId/:status', async (req, res) => {
  try {
    const { orderId, status } = req.params;
    
    // 只在演示模式下可用
    if (!moonPayService.isDemo) {
      return res.status(403).json({
        success: false,
        error: '此功能仅在演示模式下可用'
      });
    }

    const validStatuses = ['pending', 'processing', 'completed', 'failed', 'expired'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `无效的状态。支持的状态: ${validStatuses.join(', ')}`
      });
    }

    // 模拟状态更新
    const order = moonPayService.demoTransactions.get(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: '订单不存在'
      });
    }

    order.status = status;
    if (status === 'completed') {
      order.transactionHash = moonPayService.generateTransactionHash();
      order.completedAt = new Date().toISOString();
    }

    res.json({
      success: true,
      data: order,
      message: `订单状态已更新为: ${status}`
    });
  } catch (error) {
    logger.error('模拟订单状态失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;