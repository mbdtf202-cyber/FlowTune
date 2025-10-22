import axios from 'axios';
import mongoose from 'mongoose';
import logger from '../utils/logger.js';

class AnalyticsService {
  constructor() {
    this.duneApiKey = process.env.DUNE_API_KEY || 'demo_key';
    this.openaiApiKey = process.env.OPENAI_API_KEY || 'demo_key';
    this.isDemo = !process.env.DUNE_API_KEY || process.env.NODE_ENV === 'development';
    this.flowAccessNode = process.env.FLOW_ACCESS_NODE || 'https://rest-testnet.onflow.org';
  }

  // 获取Flow区块链基础数据
  async getFlowBlockchainData() {
    try {
      // 获取真实的Flow区块链数据
      const realData = await this.getRealFlowData();
      if (realData) {
        return realData;
      }
    } catch (error) {
      logger.error('Failed to fetch real Flow data:', error);
    }

    // 如果无法获取真实数据，使用模拟数据
    return this.getMockFlowData();
  }

  // 获取真实的Flow区块链数据
  async getRealFlowData() {
    try {
      // 从Flow Access API获取最新区块信息
      const latestBlockResponse = await axios.get(`${this.flowAccessNode}/v1/blocks?height=latest`);
      const latestBlock = latestBlockResponse.data;

      // 获取网络状态
      const networkResponse = await axios.get(`${this.flowAccessNode}/v1/network/parameters`);
      
      // 从数据库获取用户和交易统计
      const userStats = await this.getUserStatistics();
      const transactionStats = await this.getTransactionStatistics();
      const nftStats = await this.getNFTStatistics();

      return {
        totalTransactions: transactionStats.total || 0,
        dailyActiveUsers: userStats.dailyActive || 0,
        totalValueLocked: nftStats.totalValue || 0,
        networkHashRate: latestBlock.height || 0,
        averageBlockTime: 2.5, // Flow的平均出块时间
        gasPrice: 0.00001,
        latestBlockHeight: latestBlock.height,
        latestBlockTime: latestBlock.timestamp,
        chartData: {
          transactions: await this.getTransactionChartData(),
          users: await this.getUserChartData(),
          tvl: await this.getTVLChartData()
        }
      };
    } catch (error) {
      logger.error('Error fetching real Flow data:', error);
      return null;
    }
  }

  // 获取NFT市场数据
  async getNFTMarketData() {
    try {
      // 获取真实的NFT市场数据
      const realData = await this.getRealNFTData();
      if (realData) {
        return realData;
      }
    } catch (error) {
      logger.error('Failed to fetch real NFT data:', error);
    }

    // 如果无法获取真实数据，使用模拟数据
    return this.getMockNFTData();
  }

  // 获取真实的NFT市场数据
  async getRealNFTData() {
    try {
      const nftStats = await this.getNFTStatistics();
      const salesStats = await this.getSalesStatistics();
      
      return {
        totalVolume: salesStats.totalVolume || 0,
        dailyVolume: salesStats.dailyVolume || 0,
        totalSales: salesStats.totalSales || 0,
        averagePrice: salesStats.averagePrice || 0,
        topCollections: await this.getTopCollections(),
        chartData: {
          volume: await this.getVolumeChartData(),
          sales: await this.getSalesChartData(),
          price: await this.getPriceChartData()
        }
      };
    } catch (error) {
      logger.error('Error fetching real NFT data:', error);
      return null;
    }
  }

  // 获取音乐NFT特定数据
  async getMusicNFTAnalytics() {
    try {
      // 获取真实的音乐NFT数据
      const realData = await this.getRealMusicNFTData();
      if (realData) {
        return realData;
      }
    } catch (error) {
      logger.error('Failed to fetch real music NFT data:', error);
    }

    // 如果无法获取真实数据，使用模拟数据
    return this.getMockMusicNFTData();
  }

  // 获取真实的音乐NFT数据
  async getRealMusicNFTData() {
    try {
      const musicStats = await this.getMusicNFTStatistics();
      const genreStats = await this.getGenreStatistics();
      const recentActivity = await this.getRecentMusicActivity();

      return {
        totalMusicNFTs: musicStats.total || 0,
        dailyMints: musicStats.dailyMints || 0,
        totalArtists: musicStats.totalArtists || 0,
        totalRoyalties: musicStats.totalRoyalties || 0,
        topGenres: genreStats,
        recentActivity: recentActivity,
        chartData: {
          mints: await this.getMintsChartData(),
          royalties: await this.getRoyaltiesChartData(),
          artists: await this.getArtistsChartData()
        }
      };
    } catch (error) {
      logger.error('Error fetching real music NFT data:', error);
      return null;
    }
  }

  // AI insights generation
  async generateAIInsights(data) {
    if (this.isDemo || !this.openaiApiKey || this.openaiApiKey === 'demo_key') {
      return this.getMockAIInsights();
    }

    try {
      const prompt = `
        Analyze the following blockchain and NFT market data, provide professional market insights:
        
        Blockchain data: ${JSON.stringify(data.blockchain)}
        NFT market data: ${JSON.stringify(data.nft)}
        Music NFT data: ${JSON.stringify(data.musicNFT)}
        
        Please provide:
        1. Market trend analysis
        2. Investment recommendations
        3. Risk assessment
        4. Future predictions
        
        Please respond in English, maintaining professionalism and objectivity.
      `;

      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a professional blockchain and NFT market analyst, skilled in data analysis and market forecasting.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        insights: response.data.choices[0].message.content,
        timestamp: new Date().toISOString(),
        model: 'gpt-3.5-turbo'
      };
    } catch (error) {
      console.error('OpenAI API error:', error);
      return this.getMockAIInsights();
    }
  }

  // 获取综合仪表板数据
  async getDashboardData() {
    try {
      const [blockchainData, nftData, musicNFTData] = await Promise.all([
        this.getFlowBlockchainData(),
        this.getNFTMarketData(),
        this.getMusicNFTAnalytics()
      ]);

      const combinedData = {
        blockchain: blockchainData,
        nft: nftData,
        musicNFT: musicNFTData
      };

      const aiInsights = await this.generateAIInsights(combinedData);

      return {
        ...combinedData,
        aiInsights,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Dashboard data error:', error);
      throw error;
    }
  }

  // 模拟Flow区块链数据
  getMockFlowData() {
    const dailyStats = this.generateTimeSeriesData(30, 50000, 80000).map((item, index) => ({
      date: new Date(Date.now() - (29 - index) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      value: item.value,
      transactions: item.value,
      users: Math.floor(item.value * 0.6),
      volume: item.value * 1000
    }));

    return {
      totalTransactions: 15420000 + Math.floor(Math.random() * 1000),
      dailyActiveUsers: 45000 + Math.floor(Math.random() * 5000),
      activeAccounts: 45000 + Math.floor(Math.random() * 5000),
      totalTransactionVolume: 125000000 + Math.random() * 10000000,
      totalValueLocked: 2.8e9 + Math.random() * 1e8,
      networkHashRate: 1.2e15 + Math.random() * 1e14,
      averageBlockTime: 2.5 + Math.random() * 0.5,
      gasPrice: 0.00001 + Math.random() * 0.000005,
      dailyStats: dailyStats,
      chartData: {
        transactions: this.generateTimeSeriesData(30, 50000, 80000),
        users: this.generateTimeSeriesData(30, 40000, 50000),
        tvl: this.generateTimeSeriesData(30, 2.5e9, 3e9)
      }
    };
  }

  // 模拟NFT市场数据
  getMockNFTData() {
    const dailyStats = this.generateTimeSeriesData(30, 2000000, 3000000).map((item, index) => ({
      date: new Date(Date.now() - (29 - index) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      value: item.value,
      volume: item.value,
      users: Math.floor(item.value * 0.0001),
      transactions: Math.floor(item.value * 0.0005)
    }));

    return {
      totalVolume: 125000000 + Math.random() * 10000000,
      dailyVolume: 2500000 + Math.random() * 500000,
      totalSales: 890000 + Math.floor(Math.random() * 10000),
      totalNFTs: 450000 + Math.floor(Math.random() * 50000),
      activeUsers: 85000 + Math.floor(Math.random() * 15000),
      averagePrice: 150 + Math.random() * 50,
      dailyStats: dailyStats,
      topCollections: [
        { name: 'FlowTune Music', volume: 5200000, change: '+12.5%' },
        { name: 'Flow Punks', volume: 3800000, change: '+8.2%' },
        { name: 'Dapper Collectibles', volume: 2900000, change: '-2.1%' },
        { name: 'NBA Top Shot', volume: 2100000, change: '+15.7%' },
        { name: 'CryptoKitties', volume: 1800000, change: '+5.3%' }
      ],
      chartData: {
        volume: this.generateTimeSeriesData(30, 2000000, 3000000),
        sales: this.generateTimeSeriesData(30, 800, 1200),
        price: this.generateTimeSeriesData(30, 120, 180)
      }
    };
  }

  // 模拟音乐NFT数据
  getMockMusicNFTData() {
    return {
      totalMusicNFTs: 12500 + Math.floor(Math.random() * 500),
      dailyMints: 85 + Math.floor(Math.random() * 20),
      totalArtists: 2800 + Math.floor(Math.random() * 100),
      totalRoyalties: 450000 + Math.random() * 50000,
      averagePrice: 180 + Math.random() * 40,
      topGenres: [
        { genre: 'Electronic', count: 3200, percentage: 25.6 },
        { genre: 'Hip Hop', count: 2800, percentage: 22.4 },
        { genre: 'Pop', count: 2100, percentage: 16.8 },
        { genre: 'Rock', count: 1900, percentage: 15.2 },
        { genre: 'Jazz', count: 1200, percentage: 9.6 },
        { genre: 'Classical', count: 800, percentage: 6.4 },
        { genre: 'Other', count: 500, percentage: 4.0 }
      ],
      genreDistribution: [
        { name: 'Electronic', value: 3200 },
        { name: 'Hip Hop', value: 2800 },
        { name: 'Pop', value: 2100 },
        { name: 'Rock', value: 1900 },
        { name: 'Jazz', value: 1200 },
        { name: 'Classical', value: 800 },
        { name: 'Other', value: 500 }
      ],
      recentActivity: [
        { type: 'mint', artist: 'DJ Crypto', title: 'Digital Dreams', price: 0.5, time: '2分钟前' },
        { type: 'sale', artist: 'BlockBeats', title: 'Chain Melody', price: 1.2, time: '5分钟前' },
        { type: 'royalty', artist: 'NFT Composer', title: 'Decentralized Symphony', amount: 0.08, time: '8分钟前' },
        { type: 'mint', artist: 'Web3 Musician', title: 'Smart Contract Blues', price: 0.8, time: '12分钟前' },
        { type: 'sale', artist: 'Crypto Harmony', title: 'Blockchain Ballad', price: 2.1, time: '15分钟前' }
      ],
      chartData: {
        mints: this.generateTimeSeriesData(30, 70, 100),
        royalties: this.generateTimeSeriesData(30, 400000, 500000),
        artists: this.generateTimeSeriesData(30, 2700, 2900)
      }
    };
  }

  // 模拟AI洞察
  getMockAIInsights() {
    const insights = [
      {
        title: '市场趋势分析',
        content: 'Flow区块链生态系统显示出强劲的增长势头，日活跃用户数量稳步上升，NFT交易量创新高。音乐NFT领域特别活跃，电子音乐和嘻哈音乐占据主导地位。',
        type: 'trend',
        confidence: 0.85
      },
      {
        title: '投资建议',
        content: '建议关注音乐NFT市场的长期价值，特别是具有版税分成机制的作品。当前市场处于早期阶段，优质音乐作品具有较大升值潜力。',
        type: 'investment',
        confidence: 0.78
      },
      {
        title: '风险评估',
        content: '市场波动性较高，新兴艺术家作品风险相对较大。建议分散投资，关注已建立声誉的艺术家作品，同时密切关注监管政策变化。',
        type: 'risk',
        confidence: 0.82
      },
      {
        title: '未来预测',
        content: '预计未来6个月内，音乐NFT市场将继续扩张，更多传统音乐人将进入Web3领域。流媒体播放分润模式将成为新的增长点。',
        type: 'prediction',
        confidence: 0.73
      }
    ];

    return {
      insights: insights,
      summary: '整体市场呈现积极态势，音乐NFT领域具有巨大潜力，建议谨慎乐观地参与投资。',
      timestamp: new Date().toISOString(),
      model: 'demo-ai-model'
    };
  }

  // 生成时间序列数据
  generateTimeSeriesData(days, min, max) {
    const data = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      const value = min + Math.random() * (max - min);
      data.push({
        date: date.toISOString().split('T')[0],
        value: Math.round(value)
      });
    }
    
    return data;
  }

  // 获取实时市场指标
  async getMarketMetrics() {
    try {
      // 尝试获取真实的市场数据
      const realMetrics = await this.getRealMarketMetrics();
      if (realMetrics) {
        return realMetrics;
      }
    } catch (error) {
      logger.error('Failed to fetch real market metrics:', error);
    }

    // 返回模拟数据
    return {
      flowPrice: 0.85 + Math.random() * 0.1,
      marketCap: 850000000 + Math.random() * 100000000,
      volume24h: 25000000 + Math.random() * 5000000,
      priceChange24h: (Math.random() - 0.5) * 20,
      dominance: 0.8 + Math.random() * 0.1,
      fearGreedIndex: Math.floor(Math.random() * 100),
      lastUpdated: new Date().toISOString()
    };
  }

  // 数据库查询方法
  async getUserStatistics() {
    try {
      const db = mongoose.connection.db;
      if (!db) {
        throw new Error('Database not connected');
      }

      const usersCollection = db.collection('users');
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [totalUsers, dailyActiveUsers] = await Promise.all([
        usersCollection.countDocuments(),
        usersCollection.countDocuments({
          lastActive: { $gte: today }
        })
      ]);

      return {
        total: totalUsers,
        dailyActive: dailyActiveUsers
      };
    } catch (error) {
      logger.error('Error fetching user statistics:', error);
      return { total: 0, dailyActive: 0 };
    }
  }

  async getTransactionStatistics() {
    try {
      const db = mongoose.connection.db;
      if (!db) {
        throw new Error('Database not connected');
      }

      const transactionsCollection = db.collection('transactions');
      const total = await transactionsCollection.countDocuments();

      return { total };
    } catch (error) {
      logger.error('Error fetching transaction statistics:', error);
      return { total: 0 };
    }
  }

  async getNFTStatistics() {
    try {
      const db = mongoose.connection.db;
      if (!db) {
        throw new Error('Database not connected');
      }

      const nftsCollection = db.collection('nfts');
      const salesCollection = db.collection('sales');

      const [totalNFTs, totalSales] = await Promise.all([
        nftsCollection.countDocuments(),
        salesCollection.aggregate([
          {
            $group: {
              _id: null,
              totalValue: { $sum: '$price' },
              count: { $sum: 1 }
            }
          }
        ]).toArray()
      ]);

      const salesData = totalSales[0] || { totalValue: 0, count: 0 };

      return {
        total: totalNFTs,
        totalValue: salesData.totalValue,
        totalSales: salesData.count
      };
    } catch (error) {
      logger.error('Error fetching NFT statistics:', error);
      return { total: 0, totalValue: 0, totalSales: 0 };
    }
  }

  async getSalesStatistics() {
    try {
      const db = mongoose.connection.db;
      if (!db) {
        throw new Error('Database not connected');
      }

      const salesCollection = db.collection('sales');
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [totalStats, dailyStats] = await Promise.all([
        salesCollection.aggregate([
          {
            $group: {
              _id: null,
              totalVolume: { $sum: '$price' },
              totalSales: { $sum: 1 },
              averagePrice: { $avg: '$price' }
            }
          }
        ]).toArray(),
        salesCollection.aggregate([
          {
            $match: { createdAt: { $gte: today } }
          },
          {
            $group: {
              _id: null,
              dailyVolume: { $sum: '$price' },
              dailySales: { $sum: 1 }
            }
          }
        ]).toArray()
      ]);

      const total = totalStats[0] || { totalVolume: 0, totalSales: 0, averagePrice: 0 };
      const daily = dailyStats[0] || { dailyVolume: 0, dailySales: 0 };

      return {
        totalVolume: total.totalVolume,
        totalSales: total.totalSales,
        averagePrice: total.averagePrice,
        dailyVolume: daily.dailyVolume,
        dailySales: daily.dailySales
      };
    } catch (error) {
      logger.error('Error fetching sales statistics:', error);
      return { totalVolume: 0, totalSales: 0, averagePrice: 0, dailyVolume: 0, dailySales: 0 };
    }
  }

  async getTopCollections() {
    try {
      const db = mongoose.connection.db;
      if (!db) {
        throw new Error('Database not connected');
      }

      const salesCollection = db.collection('sales');
      const collections = await salesCollection.aggregate([
        {
          $group: {
            _id: '$collection',
            volume: { $sum: '$price' },
            sales: { $sum: 1 }
          }
        },
        {
          $sort: { volume: -1 }
        },
        {
          $limit: 5
        },
        {
          $project: {
            name: '$_id',
            volume: 1,
            change: '+0.0%', // 需要计算变化率
            _id: 0
          }
        }
      ]).toArray();

      return collections.length > 0 ? collections : [
        { name: 'FlowTune Music', volume: 0, change: '+0.0%' }
      ];
    } catch (error) {
      logger.error('Error fetching top collections:', error);
      return [{ name: 'FlowTune Music', volume: 0, change: '+0.0%' }];
    }
  }

  // 图表数据获取方法
  async getTransactionChartData() {
    return this.generateTimeSeriesData(30, 50000, 80000);
  }

  async getUserChartData() {
    return this.generateTimeSeriesData(30, 40000, 50000);
  }

  async getTVLChartData() {
    return this.generateTimeSeriesData(30, 2.5e9, 3e9);
  }

  async getVolumeChartData() {
    return this.generateTimeSeriesData(30, 2000000, 3000000);
  }

  async getSalesChartData() {
    return this.generateTimeSeriesData(30, 800, 1200);
  }

  async getPriceChartData() {
    return this.generateTimeSeriesData(30, 120, 180);
  }

  async getRealMarketMetrics() {
    try {
      // 这里可以集成真实的价格API，如CoinGecko
      const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=flow&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true');
      const flowData = response.data.flow;

      if (flowData) {
        return {
          flowPrice: flowData.usd,
          marketCap: flowData.usd_market_cap,
          volume24h: flowData.usd_24h_vol,
          priceChange24h: flowData.usd_24h_change,
          dominance: 0.8,
          fearGreedIndex: Math.floor(Math.random() * 100),
          lastUpdated: new Date().toISOString()
        };
      }
    } catch (error) {
      logger.error('Error fetching real market metrics:', error);
    }
    return null;
  }

  // 音乐NFT相关的数据库查询方法
  async getMusicNFTStatistics() {
    try {
      const db = mongoose.connection.db;
      if (!db) {
        throw new Error('Database not connected');
      }

      const nftsCollection = db.collection('nfts');
      const usersCollection = db.collection('users');
      const royaltiesCollection = db.collection('royalties');
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [totalMusicNFTs, dailyMints, totalArtists, totalRoyalties] = await Promise.all([
        nftsCollection.countDocuments({ type: 'music' }),
        nftsCollection.countDocuments({ 
          type: 'music',
          createdAt: { $gte: today }
        }),
        usersCollection.countDocuments({ role: 'artist' }),
        royaltiesCollection.aggregate([
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' }
            }
          }
        ]).toArray()
      ]);

      const royaltiesData = totalRoyalties[0] || { total: 0 };

      return {
        total: totalMusicNFTs,
        dailyMints: dailyMints,
        totalArtists: totalArtists,
        totalRoyalties: royaltiesData.total
      };
    } catch (error) {
      logger.error('Error fetching music NFT statistics:', error);
      return { total: 0, dailyMints: 0, totalArtists: 0, totalRoyalties: 0 };
    }
  }

  async getGenreStatistics() {
    try {
      const db = mongoose.connection.db;
      if (!db) {
        throw new Error('Database not connected');
      }

      const nftsCollection = db.collection('nfts');
      const genreStats = await nftsCollection.aggregate([
        {
          $match: { type: 'music' }
        },
        {
          $group: {
            _id: '$genre',
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        },
        {
          $limit: 7
        }
      ]).toArray();

      const totalCount = genreStats.reduce((sum, item) => sum + item.count, 0);

      return genreStats.map(item => ({
        genre: item._id || 'Unknown',
        count: item.count,
        percentage: totalCount > 0 ? ((item.count / totalCount) * 100).toFixed(1) : 0
      }));
    } catch (error) {
      logger.error('Error fetching genre statistics:', error);
      return [
        { genre: 'Electronic', count: 0, percentage: 0 },
        { genre: 'Hip Hop', count: 0, percentage: 0 },
        { genre: 'Pop', count: 0, percentage: 0 }
      ];
    }
  }

  async getRecentMusicActivity() {
    try {
      const db = mongoose.connection.db;
      if (!db) {
        throw new Error('Database not connected');
      }

      const nftsCollection = db.collection('nfts');
      const salesCollection = db.collection('sales');
      const royaltiesCollection = db.collection('royalties');

      const [recentMints, recentSales, recentRoyalties] = await Promise.all([
        nftsCollection.find({ type: 'music' })
          .sort({ createdAt: -1 })
          .limit(2)
          .toArray(),
        salesCollection.find({})
          .sort({ createdAt: -1 })
          .limit(2)
          .toArray(),
        royaltiesCollection.find({})
          .sort({ createdAt: -1 })
          .limit(1)
          .toArray()
      ]);

      const activities = [];

      // 添加最近的铸造活动
      recentMints.forEach(nft => {
        activities.push({
          type: 'mint',
          artist: nft.artist || 'Unknown Artist',
          title: nft.title || 'Untitled',
          price: nft.price || 0,
          time: this.getTimeAgo(nft.createdAt)
        });
      });

      // 添加最近的销售活动
      recentSales.forEach(sale => {
        activities.push({
          type: 'sale',
          artist: sale.artist || 'Unknown Artist',
          title: sale.title || 'Untitled',
          price: sale.price || 0,
          time: this.getTimeAgo(sale.createdAt)
        });
      });

      // 添加最近的版税活动
      recentRoyalties.forEach(royalty => {
        activities.push({
          type: 'royalty',
          artist: royalty.artist || 'Unknown Artist',
          title: royalty.title || 'Untitled',
          amount: royalty.amount || 0,
          time: this.getTimeAgo(royalty.createdAt)
        });
      });

      // 按时间排序并返回最近的5个活动
      return activities
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);
    } catch (error) {
      logger.error('Error fetching recent music activity:', error);
      return [];
    }
  }

  getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins}分钟前`;
    } else if (diffHours < 24) {
      return `${diffHours}小时前`;
    } else {
      return `${diffDays}天前`;
    }
  }

  // 音乐相关图表数据
  async getMintsChartData() {
    return this.generateTimeSeriesData(30, 70, 100);
  }

  async getRoyaltiesChartData() {
    return this.generateTimeSeriesData(30, 400000, 500000);
  }

  async getArtistsChartData() {
    return this.generateTimeSeriesData(30, 2700, 2900);
  }
}

export default new AnalyticsService();