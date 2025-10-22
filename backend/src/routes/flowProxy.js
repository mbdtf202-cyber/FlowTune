/**
 * Flow API Proxy Routes
 * 代理Flow区块链API请求，解决CORS问题
 */

import express from 'express';
import axios from 'axios';
import rateLimit from 'express-rate-limit';
import logger from '../utils/logger.js';

const router = express.Router();

// 检查是否为本地模式
const isLocalMode = process.env.LOCAL_DEMO_MODE === 'true' || process.env.DISABLE_NETWORK_CALLS === 'true';

// Flow API代理限流
const flowProxyLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 100, // 每分钟最多100次请求
  message: {
    success: false,
    error: 'RATE_LIMIT_ERROR',
    message: 'Flow API代理请求过于频繁，请稍后重试'
  }
});

// Flow Access Node配置
const FLOW_ACCESS_NODES = [
  'https://rest-testnet.onflow.org',
  'https://access-testnet.onflow.org'
];

let currentNodeIndex = 0;

/**
 * 获取当前可用的Flow Access Node
 */
function getCurrentAccessNode() {
  return FLOW_ACCESS_NODES[currentNodeIndex];
}

/**
 * 切换到下一个Access Node
 */
function switchToNextNode() {
  currentNodeIndex = (currentNodeIndex + 1) % FLOW_ACCESS_NODES.length;
  logger.info(`Switched to Flow Access Node: ${getCurrentAccessNode()}`);
}

/**
 * 代理Flow API请求
 */
async function proxyFlowRequest(req, res, endpoint) {
  // 本地模式下返回模拟数据
  if (isLocalMode) {
    logger.info(`🏠 Local mode: Returning mock data for ${endpoint}`);
    
    // 根据不同的端点返回不同的模拟数据
    let mockData = {};
    
    if (endpoint.includes('/network/parameters')) {
      mockData = { chainId: 'flow-testnet' };
    } else if (endpoint.includes('/blocks/sealed')) {
      mockData = { 
        id: 'mock-block-id',
        height: '12345678',
        timestamp: new Date().toISOString()
      };
    } else if (endpoint.includes('/accounts/')) {
      mockData = {
        address: req.params.address || '0x1234567890123456',
        balance: '1000000000',
        keys: []
      };
    } else if (endpoint.includes('/transactions/')) {
      mockData = {
        id: req.params.transactionId || 'mock-transaction-id',
        status: 'SEALED',
        statusCode: 0
      };
    } else {
      mockData = { message: 'Mock response for local demo' };
    }
    
    res.json({
      success: true,
      data: mockData,
      source: 'local-mock'
    });
    return;
  }
  
  const maxRetries = FLOW_ACCESS_NODES.length;
  let lastError = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const accessNode = getCurrentAccessNode();
      const url = `${accessNode}${endpoint}`;
      
      logger.info(`Proxying Flow API request to: ${url}`);

      const response = await axios({
        method: req.method,
        url: url,
        params: req.query,
        data: req.body,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 10000 // 10秒超时
      });

      // 成功响应
      res.json({
        success: true,
        data: response.data,
        source: accessNode
      });
      return;

    } catch (error) {
      lastError = error;
      logger.warn(`Flow API request failed for ${getCurrentAccessNode()}: ${error.message}`);
      
      // 如果不是最后一次尝试，切换到下一个节点
      if (attempt < maxRetries - 1) {
        switchToNextNode();
      }
    }
  }

  // 所有节点都失败了
  logger.error('All Flow Access Nodes failed:', lastError?.message);
  res.status(500).json({
    success: false,
    error: 'FLOW_API_ERROR',
    message: '所有Flow Access Node都无法访问',
    details: lastError?.message
  });
}

// 应用限流
router.use(flowProxyLimiter);

/**
 * GET /api/flow-proxy/v1/network/parameters
 * 获取网络参数
 */
router.get('/v1/network/parameters', async (req, res) => {
  await proxyFlowRequest(req, res, '/v1/network/parameters');
});

/**
 * GET /api/flow-proxy/v1/blocks/sealed
 * 获取最新封装区块
 */
router.get('/v1/blocks/sealed', async (req, res) => {
  await proxyFlowRequest(req, res, '/v1/blocks?height=sealed');
});

/**
 * GET /api/flow-proxy/v1/blocks/:blockId
 * 获取指定区块信息
 */
router.get('/v1/blocks/:blockId', async (req, res) => {
  const { blockId } = req.params;
  await proxyFlowRequest(req, res, `/v1/blocks/${blockId}`);
});

/**
 * POST /api/flow-proxy/v1/scripts
 * 执行Cadence脚本
 */
router.post('/v1/scripts', async (req, res) => {
  await proxyFlowRequest(req, res, '/v1/scripts');
});

/**
 * GET /api/flow-proxy/v1/accounts/:address
 * 获取账户信息
 */
router.get('/v1/accounts/:address', async (req, res) => {
  const { address } = req.params;
  await proxyFlowRequest(req, res, `/v1/accounts/${address}`);
});

/**
 * POST /api/flow-proxy/v1/transactions
 * 提交交易
 */
router.post('/v1/transactions', async (req, res) => {
  await proxyFlowRequest(req, res, '/v1/transactions');
});

/**
 * GET /api/flow-proxy/v1/transactions/:transactionId
 * 获取交易信息
 */
router.get('/v1/transactions/:transactionId', async (req, res) => {
  const { transactionId } = req.params;
  await proxyFlowRequest(req, res, `/v1/transactions/${transactionId}`);
});

/**
 * GET /api/flow-proxy/status
 * 获取代理状态
 */
router.get('/status', async (req, res) => {
  try {
    const currentNode = getCurrentAccessNode();
    
    // 测试当前节点连通性
    const testResponse = await axios.get(`${currentNode}/v1/network/parameters`, {
      timeout: 5000
    });

    res.json({
      success: true,
      status: 'healthy',
      currentNode: currentNode,
      availableNodes: FLOW_ACCESS_NODES,
      lastCheck: new Date().toISOString(),
      nodeStatus: 'connected'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      currentNode: getCurrentAccessNode(),
      error: error.message,
      lastCheck: new Date().toISOString()
    });
  }
});

/**
 * 通用代理路由 - 处理其他所有Flow API请求
 */
router.all('*', async (req, res) => {
  const endpoint = req.path;
  await proxyFlowRequest(req, res, endpoint);
});

export default router;