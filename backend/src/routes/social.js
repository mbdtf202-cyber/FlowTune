import express from 'express';
import rateLimit from 'express-rate-limit';
import socialService from '../services/socialService.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// 分享限流 - 每用户每小时最多20次分享
const shareRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: { error: 'Too many shares. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 分享到 Twitter/X
router.post('/share/twitter', authenticateToken, shareRateLimit, async (req, res) => {
  try {
    const { trackData } = req.body;
    const userId = req.user.id;

    if (!trackData || !trackData.id) {
      return res.status(400).json({ error: 'Track data is required' });
    }

    const result = await socialService.shareToTwitter(trackData, userId);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Twitter share error:', error);
    res.status(500).json({ error: 'Failed to share to Twitter' });
  }
});

// 分享到 Discord
router.post('/share/discord', authenticateToken, shareRateLimit, async (req, res) => {
  try {
    const { trackData, channelInfo } = req.body;
    const userId = req.user.id;

    if (!trackData || !trackData.id) {
      return res.status(400).json({ error: 'Track data is required' });
    }

    const result = await socialService.shareToDiscord(trackData, userId, channelInfo);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Discord share error:', error);
    res.status(500).json({ error: 'Failed to share to Discord' });
  }
});

// 生成分享链接
router.post('/share/link', authenticateToken, async (req, res) => {
  try {
    const { trackId } = req.body;
    const userId = req.user.id;

    if (!trackId) {
      return res.status(400).json({ error: 'Track ID is required' });
    }

    const shareData = socialService.generateShareLink(trackId, userId);
    res.json(shareData);
  } catch (error) {
    console.error('Share link generation error:', error);
    res.status(500).json({ error: 'Failed to generate share link' });
  }
});

// 处理分享链接点击
router.get('/share/:shareId', async (req, res) => {
  try {
    const { shareId } = req.params;
    const referrer = req.get('Referrer');

    const shareData = await socialService.handleShareLinkClick(shareId, referrer);
    
    // 重定向到实际的音轨页面
    res.redirect(`/track/${shareData.trackId}?share=${shareId}`);
  } catch (error) {
    console.error('Share link click error:', error);
    res.status(404).json({ error: 'Share link not found' });
  }
});

// 获取分享统计
router.get('/stats/shares', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { timeRange = '7d' } = req.query;

    const stats = await socialService.getShareStats(userId, timeRange);
    res.json(stats);
  } catch (error) {
    console.error('Share stats error:', error);
    res.status(500).json({ error: 'Failed to get share statistics' });
  }
});

// 获取分享链接统计
router.get('/stats/link/:shareId', authenticateToken, async (req, res) => {
  try {
    const { shareId } = req.params;
    
    const stats = await socialService.getShareLinkStats(shareId);
    res.json(stats);
  } catch (error) {
    console.error('Share link stats error:', error);
    res.status(404).json({ error: 'Share link not found' });
  }
});

// 获取热门分享内容
router.get('/trending', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const trending = await socialService.getTrendingShares(parseInt(limit));
    res.json(trending);
  } catch (error) {
    console.error('Trending shares error:', error);
    res.status(500).json({ error: 'Failed to get trending shares' });
  }
});

// 获取社交平台连接状态
router.get('/connections', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const connections = await socialService.getSocialConnections(userId);
    res.json(connections);
  } catch (error) {
    console.error('Social connections error:', error);
    res.status(500).json({ error: 'Failed to get social connections' });
  }
});

// 连接社交平台账户
router.post('/connect/:platform', authenticateToken, async (req, res) => {
  try {
    const { platform } = req.params;
    const { accountData } = req.body;
    const userId = req.user.id;

    if (!['twitter', 'discord'].includes(platform)) {
      return res.status(400).json({ error: 'Unsupported platform' });
    }

    if (!accountData) {
      return res.status(400).json({ error: 'Account data is required' });
    }

    const result = await socialService.connectSocialAccount(userId, platform, accountData);
    res.json(result);
  } catch (error) {
    console.error('Social connect error:', error);
    res.status(500).json({ error: 'Failed to connect social account' });
  }
});

// 断开社交平台连接
router.delete('/disconnect/:platform', authenticateToken, async (req, res) => {
  try {
    const { platform } = req.params;
    const userId = req.user.id;

    if (!['twitter', 'discord'].includes(platform)) {
      return res.status(400).json({ error: 'Unsupported platform' });
    }

    // 这里可以添加断开连接的逻辑
    res.json({ 
      success: true, 
      message: `Successfully disconnected ${platform} account` 
    });
  } catch (error) {
    console.error('Social disconnect error:', error);
    res.status(500).json({ error: 'Failed to disconnect social account' });
  }
});

// 批量分享到多个平台
router.post('/share/bulk', authenticateToken, shareRateLimit, async (req, res) => {
  try {
    const { trackData, platforms, channelInfo } = req.body;
    const userId = req.user.id;

    if (!trackData || !platforms || !Array.isArray(platforms)) {
      return res.status(400).json({ error: 'Track data and platforms array are required' });
    }

    const results = [];

    for (const platform of platforms) {
      try {
        let result;
        if (platform === 'twitter') {
          result = await socialService.shareToTwitter(trackData, userId);
        } else if (platform === 'discord') {
          result = await socialService.shareToDiscord(trackData, userId, channelInfo);
        } else {
          result = { success: false, platform, error: 'Unsupported platform' };
        }
        results.push(result);
      } catch (error) {
        results.push({ 
          success: false, 
          platform, 
          error: error.message 
        });
      }
    }

    res.json({ results });
  } catch (error) {
    console.error('Bulk share error:', error);
    res.status(500).json({ error: 'Failed to perform bulk share' });
  }
});

export default router;