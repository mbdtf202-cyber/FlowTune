/**
 * QuickNode API 路由
 * 提供区块链数据和实时事件的API接口
 */

import express from 'express';
import quickNodeService from '../services/quickNodeService.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// 限流中间件
const quickNodeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 30, // 每分钟最多30次请求
  message: {
    success: false,
    error: 'RATE_LIMIT_ERROR',
    message: 'QuickNode API requests too frequent, please try again later'
  }
});

/**
 * @route GET /api/quicknode/status
 * @desc 获取QuickNode连接状态
 * @access Public
 */
router.get('/status', quickNodeLimiter, async (req, res) => {
  try {
    const stats = await quickNodeService.getBlockchainStats();
    
    res.json({
      success: true,
      data: {
        connection_status: stats.connection_status,
        service_status: 'active',
        last_updated: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'QUICKNODE_STATUS_ERROR',
      message: 'Failed to get QuickNode status',
      details: error.message
    });
  }
});

/**
 * @route GET /api/quicknode/stats
 * @desc 获取区块链统计信息
 * @access Public
 */
router.get('/stats', quickNodeLimiter, async (req, res) => {
  try {
    const stats = await quickNodeService.getBlockchainStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'BLOCKCHAIN_STATS_ERROR',
      message: '获取区块链统计信息失败',
      details: error.message
    });
  }
});

/**
 * @route GET /api/quicknode/blocks/latest
 * @desc 获取最新区块信息
 * @access Public
 */
router.get('/blocks/latest', quickNodeLimiter, async (req, res) => {
  try {
    const latestBlock = await quickNodeService.testRPCConnection();
    
    res.json({
      success: true,
      data: {
        block: latestBlock,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'LATEST_BLOCK_ERROR',
      message: '获取最新区块信息失败',
      details: error.message
    });
  }
});

/**
 * @route GET /api/quicknode/events/nft/:tokenId
 * @desc 获取特定NFT的事件历史
 * @access Public
 */
router.get('/events/nft/:tokenId', quickNodeLimiter, async (req, res) => {
  try {
    const { tokenId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const offset = (page - 1) * limit;
    
    // 获取NFT相关事件
    const [transfers, royalties] = await Promise.all([
      quickNodeService.db.query(`
        SELECT * FROM nft_transfers 
        WHERE token_id = ? 
        ORDER BY timestamp DESC 
        LIMIT ? OFFSET ?
      `, [tokenId, parseInt(limit), offset]),
      
      quickNodeService.db.query(`
        SELECT * FROM royalty_payments 
        WHERE token_id = ? 
        ORDER BY timestamp DESC 
        LIMIT ? OFFSET ?
      `, [tokenId, parseInt(limit), offset])
    ]);
    
    res.json({
      success: true,
      data: {
        token_id: tokenId,
        transfers,
        royalty_payments: royalties,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total_transfers: transfers.length,
          total_royalties: royalties.length
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'NFT_EVENTS_ERROR',
      message: '获取NFT事件历史失败',
      details: error.message
    });
  }
});

/**
 * @route GET /api/quicknode/events/recent
 * @desc 获取最近的区块链事件
 * @access Public
 */
router.get('/events/recent', quickNodeLimiter, async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    
    // 获取最近的事件
    const [recentTransfers, recentRoyalties, recentBlocks] = await Promise.all([
      quickNodeService.db.query(`
        SELECT 'transfer' as event_type, token_id, from_address, to_address, 
               transaction_hash, block_number, timestamp
        FROM nft_transfers 
        ORDER BY timestamp DESC 
        LIMIT ?
      `, [Math.floor(limit / 3)]),
      
      quickNodeService.db.query(`
        SELECT 'royalty' as event_type, token_id, recipient_address, amount,
               transaction_hash, block_number, timestamp
        FROM royalty_payments 
        ORDER BY timestamp DESC 
        LIMIT ?
      `, [Math.floor(limit / 3)]),
      
      quickNodeService.db.query(`
        SELECT 'block' as event_type, block_number, block_hash, 
               transaction_count, timestamp
        FROM blockchain_blocks 
        ORDER BY timestamp DESC 
        LIMIT ?
      `, [Math.floor(limit / 3)])
    ]);
    
    // 合并并按时间排序
    const allEvents = [...recentTransfers, ...recentRoyalties, ...recentBlocks]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
    
    res.json({
      success: true,
      data: {
        events: allEvents,
        total: allEvents.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'RECENT_EVENTS_ERROR',
      message: '获取最近事件失败',
      details: error.message
    });
  }
});

/**
 * @route POST /api/quicknode/webhook
 * @desc QuickNode Webhook接收端点
 * @access Public (但应该验证来源)
 */
router.post('/webhook', async (req, res) => {
  try {
    const { event, data } = req.body;
    
    // 验证webhook来源（简化版本）
    const signature = req.headers['x-quicknode-signature'];
    if (!signature) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: '缺少webhook签名'
      });
    }
    
    // 处理webhook事件
    await quickNodeService.processEvent(event, data);
    
    res.json({
      success: true,
      message: 'Webhook事件处理成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'WEBHOOK_ERROR',
      message: 'Webhook处理失败',
      details: error.message
    });
  }
});

/**
 * @route GET /api/quicknode/analytics/dashboard
 * @desc 获取区块链分析仪表板数据
 * @access Private
 */
router.get('/analytics/dashboard', authenticateToken, quickNodeLimiter, async (req, res) => {
  try {
    const { timeframe = '24h' } = req.query;
    
    let timeCondition = '';
    switch (timeframe) {
      case '1h':
        timeCondition = 'timestamp >= DATE_SUB(NOW(), INTERVAL 1 HOUR)';
        break;
      case '24h':
        timeCondition = 'timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)';
        break;
      case '7d':
        timeCondition = 'timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
        break;
      case '30d':
        timeCondition = 'timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
        break;
      default:
        timeCondition = 'timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)';
    }
    
    // 获取分析数据
    const [
      transactionVolume,
      nftActivity,
      royaltyMetrics,
      blockMetrics
    ] = await Promise.all([
      quickNodeService.db.query(`
        SELECT 
          DATE(timestamp) as date,
          COUNT(*) as transaction_count
        FROM nft_transfers 
        WHERE ${timeCondition}
        GROUP BY DATE(timestamp)
        ORDER BY date DESC
      `),
      
      quickNodeService.db.query(`
        SELECT 
          COUNT(*) as total_transfers,
          COUNT(DISTINCT token_id) as unique_nfts,
          COUNT(DISTINCT from_address) as unique_sellers,
          COUNT(DISTINCT to_address) as unique_buyers
        FROM nft_transfers 
        WHERE ${timeCondition}
      `),
      
      quickNodeService.db.query(`
        SELECT 
          COUNT(*) as total_payments,
          SUM(amount) as total_amount,
          AVG(amount) as average_amount,
          COUNT(DISTINCT recipient_address) as unique_recipients
        FROM royalty_payments 
        WHERE ${timeCondition}
      `),
      
      quickNodeService.db.query(`
        SELECT 
          COUNT(*) as total_blocks,
          AVG(transaction_count) as avg_transactions_per_block,
          MAX(block_number) as latest_block_number
        FROM blockchain_blocks 
        WHERE ${timeCondition}
      `)
    ]);
    
    res.json({
      success: true,
      data: {
        timeframe,
        transaction_volume: transactionVolume,
        nft_activity: nftActivity[0] || {},
        royalty_metrics: royaltyMetrics[0] || {},
        block_metrics: blockMetrics[0] || {},
        generated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'ANALYTICS_ERROR',
      message: '获取分析数据失败',
      details: error.message
    });
  }
});

/**
 * @route POST /api/quicknode/subscribe
 * @desc 订阅实时事件通知
 * @access Private
 */
router.post('/subscribe', authenticateToken, async (req, res) => {
  try {
    const { event_types, webhook_url } = req.body;
    const userId = req.user.id;
    
    if (!event_types || !Array.isArray(event_types)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_PARAMS',
        message: '事件类型参数无效'
      });
    }
    
    // 保存订阅信息
    await quickNodeService.db.query(`
      INSERT INTO event_subscriptions (
        user_id, event_types, webhook_url, created_at
      ) VALUES (?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        event_types = VALUES(event_types),
        webhook_url = VALUES(webhook_url),
        updated_at = NOW()
    `, [userId, JSON.stringify(event_types), webhook_url]);
    
    res.json({
      success: true,
      message: '事件订阅设置成功',
      data: {
        user_id: userId,
        event_types,
        webhook_url
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'SUBSCRIPTION_ERROR',
      message: '设置事件订阅失败',
      details: error.message
    });
  }
});

export default router;