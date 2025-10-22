import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = express.Router();

// 获取活动流
router.get('/stream', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const offset = (page - 1) * limit;

    // 模拟活动数据 - 在实际应用中，这些数据应该从数据库获取
    const mockActivities = [
      {
        id: '1',
        type: 'music_upload',
        userId: 'user1',
        user: { name: 'Alice Chen', avatar: '/api/placeholder/32/32' },
        content: '上传了新音乐作品 "Sunset Dreams"',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        metadata: { musicTitle: 'Sunset Dreams', genre: 'Electronic' }
      },
      {
        id: '2',
        type: 'like',
        userId: 'user2',
        user: { name: 'Bob Wilson', avatar: '/api/placeholder/32/32' },
        content: '喜欢了 "Midnight Jazz" by Sarah',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        metadata: { targetUser: 'Sarah', musicTitle: 'Midnight Jazz' }
      },
      {
        id: '3',
        type: 'comment',
        userId: 'user3',
        user: { name: 'Charlie Davis', avatar: '/api/placeholder/32/32' },
        content: '评论了 "Ocean Waves"',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        metadata: { comment: '这首歌太棒了！', musicTitle: 'Ocean Waves' }
      },
      {
        id: '4',
        type: 'follow',
        userId: 'user4',
        user: { name: 'Diana Lee', avatar: '/api/placeholder/32/32' },
        content: '关注了 Emma Rodriguez',
        timestamp: new Date(Date.now() - 45 * 60 * 1000),
        metadata: { targetUser: 'Emma Rodriguez' }
      },
      {
        id: '5',
        type: 'trending',
        userId: 'system',
        user: { name: 'System', avatar: '/api/placeholder/32/32' },
        content: '"Lo-Fi Beats" 正在热门榜单上升',
        timestamp: new Date(Date.now() - 60 * 60 * 1000),
        metadata: { musicTitle: 'Lo-Fi Beats', trend: 'rising' }
      }
    ];

    // 根据类型过滤
    let filteredActivities = mockActivities;
    if (type) {
      filteredActivities = mockActivities.filter(activity => activity.type === type);
    }

    // 分页
    const paginatedActivities = filteredActivities.slice(offset, offset + parseInt(limit));

    res.json({
      success: true,
      data: {
        activities: paginatedActivities,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: filteredActivities.length,
          totalPages: Math.ceil(filteredActivities.length / limit)
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching activity stream', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity stream'
    });
  }
});

// 获取实时统计数据
router.get('/stats', async (req, res) => {
  try {
    // 模拟实时统计数据
    const stats = {
      onlineUsers: Math.floor(Math.random() * 1000) + 1000,
      totalTracks: Math.floor(Math.random() * 5000) + 15000,
      totalLikes: Math.floor(Math.random() * 10000) + 80000,
      activeListeners: Math.floor(Math.random() * 500) + 500,
      trendsData: [
        { genre: 'Electronic', count: 234, change: '+12%' },
        { genre: 'Jazz', count: 189, change: '+8%' },
        { genre: 'Rock', count: 156, change: '+5%' },
        { genre: 'Classical', count: 134, change: '+3%' }
      ]
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error('Error fetching stats', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stats'
    });
  }
});

// 创建新活动 (用于测试)
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { type, content, metadata } = req.body;
    const userId = req.user.id;

    // 创建活动对象
    const activity = {
      id: Date.now().toString(),
      type,
      userId,
      user: {
        name: req.user.name || 'Anonymous User',
        avatar: req.user.avatar || '/api/placeholder/32/32'
      },
      content,
      timestamp: new Date(),
      metadata: metadata || {}
    };

    // 通过WebSocket广播活动
    if (global.websocketService) {
      global.websocketService.broadcast({
        type: 'user_activity',
        data: activity
      });
    }

    logger.info('Activity created and broadcasted', { 
      activityId: activity.id, 
      type: activity.type,
      userId 
    });

    res.json({
      success: true,
      data: activity,
      message: 'Activity created successfully'
    });

  } catch (error) {
    logger.error('Error creating activity', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to create activity'
    });
  }
});

// 广播统计更新 (用于测试)
router.post('/broadcast-stats', async (req, res) => {
  try {
    const stats = req.body;

    // 通过WebSocket广播统计更新
    if (global.websocketService) {
      global.websocketService.broadcast({
        type: 'stats_update',
        data: stats
      });
    }

    logger.info('Stats broadcasted', { stats });

    res.json({
      success: true,
      message: 'Stats broadcasted successfully'
    });

  } catch (error) {
    logger.error('Error broadcasting stats', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to broadcast stats'
    });
  }
});

export default router;