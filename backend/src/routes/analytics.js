import express from 'express';
import analyticsService from '../services/analyticsService.js';
import { authenticateToken } from '../middleware/auth.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// 限流中间件
const analyticsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 每个IP最多100次请求
  message: {
    error: 'Too many analytics requests, please try again later.'
  }
});

// 应用限流
router.use(analyticsLimiter);

// 获取综合仪表板数据
router.get('/dashboard', async (req, res) => {
  try {
    const dashboardData = await analyticsService.getDashboardData();
    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data'
    });
  }
});

// 获取Flow区块链数据
router.get('/blockchain', async (req, res) => {
  try {
    const blockchainData = await analyticsService.getFlowBlockchainData();
    res.json({
      success: true,
      data: blockchainData
    });
  } catch (error) {
    console.error('Blockchain data error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch blockchain data'
    });
  }
});

// 获取NFT市场数据
router.get('/nft-market', async (req, res) => {
  try {
    const nftData = await analyticsService.getNFTMarketData();
    res.json({
      success: true,
      data: nftData
    });
  } catch (error) {
    console.error('NFT market data error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch NFT market data'
    });
  }
});

// 获取音乐NFT分析数据
router.get('/music-nft', async (req, res) => {
  try {
    const musicNFTData = await analyticsService.getMusicNFTAnalytics();
    res.json({
      success: true,
      data: musicNFTData
    });
  } catch (error) {
    console.error('Music NFT data error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch music NFT data'
    });
  }
});

// 获取AI洞察（需要认证）
router.get('/ai-insights', authenticateToken, async (req, res) => {
  try {
    const { blockchain, nft, musicNFT } = req.query;
    
    let data = {};
    if (blockchain) data.blockchain = JSON.parse(blockchain);
    if (nft) data.nft = JSON.parse(nft);
    if (musicNFT) data.musicNFT = JSON.parse(musicNFT);
    
    // 如果没有提供数据，获取最新数据
    if (Object.keys(data).length === 0) {
      const [blockchainData, nftData, musicNFTData] = await Promise.all([
        analyticsService.getFlowBlockchainData(),
        analyticsService.getNFTMarketData(),
        analyticsService.getMusicNFTAnalytics()
      ]);
      
      data = {
        blockchain: blockchainData,
        nft: nftData,
        musicNFT: musicNFTData
      };
    }
    
    const insights = await analyticsService.generateAIInsights(data);
    res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    console.error('AI insights error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate AI insights'
    });
  }
});

// 获取市场指标
router.get('/market-metrics', async (req, res) => {
  try {
    const metrics = await analyticsService.getMarketMetrics();
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Market metrics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch market metrics'
    });
  }
});

// 获取历史数据
router.get('/historical/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { days = 30 } = req.query;
    
    let data;
    switch (type) {
      case 'blockchain':
        data = await analyticsService.getFlowBlockchainData();
        break;
      case 'nft':
        data = await analyticsService.getNFTMarketData();
        break;
      case 'music':
        data = await analyticsService.getMusicNFTAnalytics();
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid data type'
        });
    }
    
    res.json({
      success: true,
      data: data.chartData || data,
      type,
      days: parseInt(days)
    });
  } catch (error) {
    console.error('Historical data error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch historical data'
    });
  }
});

// 获取实时统计
router.get('/realtime', async (req, res) => {
  try {
    const [blockchainData, nftData, musicNFTData, marketMetrics] = await Promise.all([
      analyticsService.getFlowBlockchainData(),
      analyticsService.getNFTMarketData(),
      analyticsService.getMusicNFTAnalytics(),
      analyticsService.getMarketMetrics()
    ]);
    
    const realtimeData = {
      blockchain: {
        transactions: blockchainData.totalTransactions,
        activeUsers: blockchainData.dailyActiveUsers,
        tvl: blockchainData.totalValueLocked
      },
      nft: {
        volume: nftData.dailyVolume,
        sales: nftData.totalSales,
        averagePrice: nftData.averagePrice
      },
      music: {
        dailyMints: musicNFTData.dailyMints,
        totalArtists: musicNFTData.totalArtists,
        royalties: musicNFTData.totalRoyalties
      },
      market: marketMetrics,
      timestamp: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: realtimeData
    });
  } catch (error) {
    console.error('Realtime data error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch realtime data'
    });
  }
});

// 获取服务状态
router.get('/status', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'operational',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        blockchain: 'connected',
        ai: 'operational'
      }
    }
  });
});

// 获取用户分享统计
router.get('/share-stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // 模拟分享统计数据
    const shareStats = {
      totalShares: 45,
      twitterShares: 28,
      discordShares: 17,
      recentShares: [
        {
          platform: 'twitter',
          trackId: 'track_1',
          trackTitle: 'Ethereal Dreams',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          platform: 'discord',
          trackId: 'track_2', 
          trackTitle: 'Urban Pulse',
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
        }
      ]
    };

    res.json({
      success: true,
      data: shareStats
    });
  } catch (error) {
    console.error('Share stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch share statistics'
    });
  }
});

export default router;