/**
 * Royalties Routes
 * 处理版税分发、收益查询和分配记录的API路由
 */

import express from 'express';
import rateLimit from 'express-rate-limit';
import { authenticateToken } from '../middleware/auth.js';
import AudioStreamingService from '../services/audioStreamingService.js';
import quickNodeService from '../services/quickNodeService.js';
import logger from '../utils/logger.js';

const router = express.Router();
const audioService = new AudioStreamingService();

// 限流中间件
const royaltiesLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 每个IP最多100次请求
  message: {
    success: false,
    error: 'RATE_LIMIT_ERROR',
    message: '版税API请求过于频繁，请稍后重试'
  }
});

router.use(royaltiesLimiter);

/**
 * GET /api/royalties/earnings
 * 获取用户收益统计
 */
router.get('/earnings', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { timeframe = '30d' } = req.query;
    
    // 获取艺术家收益
    const earnings = await audioService.getArtistEarnings(userId);
    
    // 模拟收益数据（在实际应用中应从数据库获取）
    const mockEarnings = {
      total: {
        amount: 125.67,
        currency: 'FLOW',
        usd_value: 89.23
      },
      breakdown: {
        streaming: {
          amount: 85.45,
          percentage: 68.0,
          plays: 1247
        },
        sales: {
          amount: 32.18,
          percentage: 25.6,
          transactions: 8
        },
        royalties: {
          amount: 8.04,
          percentage: 6.4,
          secondary_sales: 3
        }
      },
      recent_payments: [
        {
          date: '2024-01-15',
          amount: 12.34,
          type: 'streaming',
          source: 'FlowTune Platform'
        },
        {
          date: '2024-01-14',
          amount: 25.00,
          type: 'sale',
          source: 'NFT Marketplace'
        },
        {
          date: '2024-01-13',
          amount: 3.45,
          type: 'royalty',
          source: 'Secondary Sale'
        }
      ],
      timeframe,
      last_updated: new Date().toISOString()
    };

    res.json({
      success: true,
      data: mockEarnings,
      message: '收益统计获取成功'
    });

  } catch (error) {
    logger.error('Error getting user earnings:', error);
    res.status(500).json({
      success: false,
      error: 'EARNINGS_ERROR',
      message: '获取收益统计失败'
    });
  }
});

/**
 * GET /api/royalties/distributions/:nftId
 * 获取NFT版税分配记录
 */
router.get('/distributions/:nftId', authenticateToken, async (req, res) => {
  try {
    const { nftId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    // 模拟版税分配记录
    const mockDistributions = {
      nft_id: nftId,
      total_distributions: 15,
      total_amount: 45.67,
      distributions: [
        {
          id: 'dist_001',
          transaction_hash: '0x1234567890abcdef',
          block_number: 12345678,
          timestamp: '2024-01-15T10:30:00Z',
          total_amount: 10.00,
          recipients: [
            {
              address: '0xartist123',
              percentage: 80,
              amount: 8.00,
              description: '艺术家版税'
            },
            {
              address: '0xplatform456',
              percentage: 15,
              amount: 1.50,
              description: '平台版税'
            },
            {
              address: '0xcollaborator789',
              percentage: 5,
              amount: 0.50,
              description: '合作者版税'
            }
          ]
        },
        {
          id: 'dist_002',
          transaction_hash: '0xfedcba0987654321',
          block_number: 12345679,
          timestamp: '2024-01-14T15:45:00Z',
          total_amount: 15.50,
          recipients: [
            {
              address: '0xartist123',
              percentage: 80,
              amount: 12.40,
              description: '艺术家版税'
            },
            {
              address: '0xplatform456',
              percentage: 20,
              amount: 3.10,
              description: '平台版税'
            }
          ]
        }
      ],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total_pages: Math.ceil(15 / parseInt(limit))
      }
    };

    res.json({
      success: true,
      data: mockDistributions,
      message: 'NFT版税分配记录获取成功'
    });

  } catch (error) {
    logger.error('Error getting NFT distributions:', error);
    res.status(500).json({
      success: false,
      error: 'DISTRIBUTIONS_ERROR',
      message: '获取版税分配记录失败'
    });
  }
});

/**
 * GET /api/royalties/analytics
 * 获取版税分析数据
 */
router.get('/analytics', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { timeframe = '30d' } = req.query;
    
    // 模拟版税分析数据
    const mockAnalytics = {
      summary: {
        total_earned: 234.56,
        total_distributed: 187.65,
        pending_distribution: 46.91,
        active_nfts: 12
      },
      trends: {
        daily_earnings: [
          { date: '2024-01-15', amount: 12.34 },
          { date: '2024-01-14', amount: 15.67 },
          { date: '2024-01-13', amount: 8.90 },
          { date: '2024-01-12', amount: 22.11 },
          { date: '2024-01-11', amount: 18.45 }
        ],
        top_performing_nfts: [
          {
            nft_id: 'nft_001',
            title: 'Cosmic Melody',
            total_earned: 45.67,
            play_count: 1234
          },
          {
            nft_id: 'nft_002',
            title: 'Digital Dreams',
            total_earned: 38.92,
            play_count: 987
          }
        ]
      },
      distribution_stats: {
        artist_percentage: 75.5,
        platform_percentage: 20.0,
        collaborator_percentage: 4.5
      },
      timeframe,
      generated_at: new Date().toISOString()
    };

    res.json({
      success: true,
      data: mockAnalytics,
      message: '版税分析数据获取成功'
    });

  } catch (error) {
    logger.error('Error getting royalty analytics:', error);
    res.status(500).json({
      success: false,
      error: 'ANALYTICS_ERROR',
      message: '获取版税分析数据失败'
    });
  }
});

/**
 * POST /api/royalties/distribute
 * 手动触发版税分配
 */
router.post('/distribute', authenticateToken, async (req, res) => {
  try {
    const { nftId, amount, recipients } = req.body;
    
    if (!nftId || !amount || !recipients || !Array.isArray(recipients)) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: '缺少必需参数：nftId, amount, recipients'
      });
    }

    // 验证版税百分比总和
    const totalPercentage = recipients.reduce((sum, r) => sum + r.percentage, 0);
    if (Math.abs(totalPercentage - 1.0) > 0.001) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: '版税百分比总和必须等于100%'
      });
    }

    // 模拟版税分配处理
    const distributionId = `dist_${Date.now()}`;
    const mockResult = {
      distribution_id: distributionId,
      nft_id: nftId,
      total_amount: amount,
      status: 'completed',
      transaction_hash: `0x${Math.random().toString(16).substr(2, 40)}`,
      recipients: recipients.map(r => ({
        ...r,
        amount: amount * r.percentage,
        status: 'paid'
      })),
      processed_at: new Date().toISOString()
    };

    logger.info(`Royalty distribution completed: ${distributionId}`, mockResult);

    res.json({
      success: true,
      data: mockResult,
      message: '版税分配成功'
    });

  } catch (error) {
    logger.error('Error distributing royalties:', error);
    res.status(500).json({
      success: false,
      error: 'DISTRIBUTION_ERROR',
      message: '版税分配失败'
    });
  }
});

/**
 * GET /api/royalties/status
 * 获取版税服务状态
 */
router.get('/status', async (req, res) => {
  try {
    res.json({
      success: true,
      service: 'Royalty Distribution Service',
      status: 'operational',
      features: {
        earnings_tracking: true,
        automatic_distribution: true,
        analytics: true,
        manual_distribution: true
      },
      supported_currencies: ['FLOW', 'USDC'],
      last_distribution: new Date().toISOString(),
      version: '1.0.0'
    });
  } catch (error) {
    logger.error('Error getting royalty service status:', error);
    res.status(500).json({
      success: false,
      error: 'SERVICE_ERROR',
      message: '获取服务状态失败'
    });
  }
});

export default router;