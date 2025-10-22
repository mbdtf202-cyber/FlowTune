import express from 'express';
import { aiRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// 模拟用户数据
const mockUsers = {
  'demo_user': {
    id: 'demo_user',
    displayName: 'Demo User',
    username: 'demo_user',
    bio: 'AI音乐创作者，专注于电子音乐和环境音乐的创作',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face',
    joinDate: '2024-01-01T00:00:00Z',
    location: 'Digital World',
    website: 'https://flowtune.ai',
    stats: {
      totalTracks: 12,
      totalPlays: 1250,
      totalLikes: 89,
      followers: 156
    },
    badges: ['Early Adopter', 'AI Pioneer', 'Top Creator']
  }
};

const mockSocialConnections = {
  'demo_user': {
    twitter: {
      connected: true,
      username: '@demo_user'
    },
    discord: {
      connected: false,
      username: null
    }
  }
};

const mockShareStats = {
  'demo_user': {
    totalShares: 45,
    twitterShares: 28,
    discordShares: 17
  }
};

// 获取用户资料
router.get('/profile/:userId', aiRateLimiter, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = mockUsers[userId];
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile'
    });
  }
});

// 获取用户社交连接
router.get('/social-connections/:userId', aiRateLimiter, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const connections = mockSocialConnections[userId] || {};
    
    res.json({
      success: true,
      data: connections
    });
  } catch (error) {
    console.error('Error fetching social connections:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch social connections'
    });
  }
});

// 更新用户资料
router.put('/profile/:userId', aiRateLimiter, async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;
    
    if (!mockUsers[userId]) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // 更新用户数据
    mockUsers[userId] = {
      ...mockUsers[userId],
      ...updates,
      id: userId // 确保ID不被覆盖
    };

    res.json({
      success: true,
      data: mockUsers[userId]
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user profile'
    });
  }
});

// 连接社交账户
router.post('/social-connections/:userId/:platform', aiRateLimiter, async (req, res) => {
  try {
    const { userId, platform } = req.params;
    const { username } = req.body;
    
    if (!mockSocialConnections[userId]) {
      mockSocialConnections[userId] = {};
    }

    mockSocialConnections[userId][platform] = {
      connected: true,
      username: username
    };

    res.json({
      success: true,
      data: mockSocialConnections[userId]
    });
  } catch (error) {
    console.error('Error connecting social account:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to connect social account'
    });
  }
});

// 断开社交账户连接
router.delete('/social-connections/:userId/:platform', aiRateLimiter, async (req, res) => {
  try {
    const { userId, platform } = req.params;
    
    if (mockSocialConnections[userId] && mockSocialConnections[userId][platform]) {
      mockSocialConnections[userId][platform] = {
        connected: false,
        username: null
      };
    }

    res.json({
      success: true,
      data: mockSocialConnections[userId] || {}
    });
  } catch (error) {
    console.error('Error disconnecting social account:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disconnect social account'
    });
  }
});

export default router;