/**
 * 音频流媒体路由
 * 处理音频播放、统计和分润相关API
 */

import express from 'express';
import rateLimit from 'express-rate-limit';
import { authenticateToken } from '../middleware/auth.js';
import AudioStreamingService from '../services/audioStreamingService.js';
import logger from '../utils/logger.js';

const router = express.Router();
const audioService = new AudioStreamingService();

// 播放限流 - 防止恶意刷播放量
const playLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 10, // 每分钟最多10次播放请求
  message: { error: 'Too many play requests, please try again later' }
});

/**
 * 开始播放音频
 */
router.post('/play/start', playLimiter, authenticateToken, async (req, res) => {
  try {
    const { trackId } = req.body;
    const userId = req.user.id;
    
    if (!trackId) {
      return res.status(400).json({ error: 'Track ID is required' });
    }

    const sessionId = `${userId}_${trackId}_${Date.now()}`;
    const result = await audioService.startPlayback(userId, trackId, sessionId);
    
    // 生成流媒体URL
    const streamInfo = audioService.generateStreamUrl(trackId, userId, req.user.tier || 'free');
    
    res.json({
      success: true,
      sessionId: result.sessionId,
      streamUrl: streamInfo.streamUrl,
      config: streamInfo.config
    });
  } catch (error) {
    logger.error('Error starting playback:', error);
    res.status(500).json({ error: 'Failed to start playback' });
  }
});

/**
 * 更新播放进度
 */
router.post('/play/progress', authenticateToken, async (req, res) => {
  try {
    const { sessionId, currentTime, totalDuration } = req.body;
    
    if (!sessionId || currentTime === undefined) {
      return res.status(400).json({ error: 'Session ID and current time are required' });
    }

    const result = await audioService.updatePlaybackProgress(sessionId, currentTime, totalDuration);
    
    res.json(result);
  } catch (error) {
    logger.error('Error updating playback progress:', error);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

/**
 * 结束播放
 */
router.post('/play/end', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    const result = await audioService.endPlayback(sessionId);
    
    res.json(result);
  } catch (error) {
    logger.error('Error ending playback:', error);
    res.status(500).json({ error: 'Failed to end playback' });
  }
});

/**
 * 获取音轨统计信息
 */
router.get('/stats/track/:trackId', async (req, res) => {
  try {
    const { trackId } = req.params;
    const stats = await audioService.getTrackStats(trackId);
    
    res.json({
      success: true,
      trackId,
      stats
    });
  } catch (error) {
    logger.error('Error getting track stats:', error);
    res.status(500).json({ error: 'Failed to get track stats' });
  }
});

/**
 * 获取用户播放历史
 */
router.get('/history/user', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;
    
    const history = await audioService.getUserPlayHistory(userId, limit);
    
    res.json({
      success: true,
      history
    });
  } catch (error) {
    logger.error('Error getting user play history:', error);
    res.status(500).json({ error: 'Failed to get play history' });
  }
});

/**
 * 获取艺术家收益统计
 */
router.get('/earnings/artist/:artistId', authenticateToken, async (req, res) => {
  try {
    const { artistId } = req.params;
    
    // 检查权限 - 只有艺术家本人或管理员可以查看收益
    if (req.user.id !== artistId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const earnings = await audioService.getArtistEarnings(artistId);
    
    res.json({
      success: true,
      artistId,
      earnings
    });
  } catch (error) {
    logger.error('Error getting artist earnings:', error);
    res.status(500).json({ error: 'Failed to get earnings' });
  }
});

/**
 * 音频流媒体端点
 */
router.get('/stream/:trackId', async (req, res) => {
  try {
    const { trackId } = req.params;
    const { quality = 'free', session } = req.query;
    
    // 验证会话
    if (!session) {
      return res.status(400).json({ error: 'Session ID is required' });
    }
    
    // 获取质量配置
    const config = audioService.getStreamingQuality(quality);
    
    // 在实际应用中，这里会：
    // 1. 验证用户权限
    // 2. 从存储中获取音频文件
    // 3. 根据质量配置转码
    // 4. 流式传输音频数据
    
    // 模拟音频流响应
    res.set({
      'Content-Type': 'audio/mpeg',
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-cache',
      'X-Audio-Quality': config.bitrate,
      'X-Audio-Format': config.format
    });
    
    // 模拟流媒体数据
    const mockAudioData = Buffer.from('Mock audio stream data for track ' + trackId);
    res.send(mockAudioData);
    
  } catch (error) {
    logger.error('Error streaming audio:', error);
    res.status(500).json({ error: 'Failed to stream audio' });
  }
});

/**
 * 获取流媒体质量选项
 */
router.get('/quality/options', authenticateToken, async (req, res) => {
  try {
    const userTier = req.user.tier || 'free';
    const availableQualities = [];
    
    // 根据用户等级提供不同质量选项
    availableQualities.push({
      id: 'free',
      name: 'Preview (128kbps)',
      bitrate: 128,
      format: 'mp3',
      available: true,
      description: '30-second preview'
    });
    
    if (userTier === 'premium' || userTier === 'hifi') {
      availableQualities.push({
        id: 'premium',
        name: 'High Quality (320kbps)',
        bitrate: 320,
        format: 'mp3',
        available: true,
        description: 'Full track, high quality'
      });
    }
    
    if (userTier === 'hifi') {
      availableQualities.push({
        id: 'hifi',
        name: 'Lossless (1411kbps)',
        bitrate: 1411,
        format: 'flac',
        available: true,
        description: 'Studio quality, lossless'
      });
    }
    
    res.json({
      success: true,
      userTier,
      qualities: availableQualities
    });
  } catch (error) {
    logger.error('Error getting quality options:', error);
    res.status(500).json({ error: 'Failed to get quality options' });
  }
});

/**
 * 获取热门音轨
 */
router.get('/trending', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const timeframe = req.query.timeframe || '24h'; // 24h, 7d, 30d
    
    // 模拟热门音轨数据
    const trendingTracks = [
      {
        id: 'track_1',
        title: 'Neon Dreams',
        artist: 'CyberSynth',
        genre: 'Electronic',
        plays: 15420,
        trend: '+25%'
      },
      {
        id: 'track_2',
        title: 'Urban Flow',
        artist: 'BeatMaster',
        genre: 'Hip Hop',
        plays: 12890,
        trend: '+18%'
      },
      {
        id: 'track_3',
        title: 'Midnight Jazz',
        artist: 'SmoothGroove',
        genre: 'Jazz',
        plays: 9876,
        trend: '+12%'
      }
    ].slice(0, limit);
    
    res.json({
      success: true,
      timeframe,
      tracks: trendingTracks
    });
  } catch (error) {
    logger.error('Error getting trending tracks:', error);
    res.status(500).json({ error: 'Failed to get trending tracks' });
  }
});

/**
 * 获取服务状态
 */
router.get('/status', async (req, res) => {
  try {
    res.json({
      success: true,
      service: 'Audio Streaming Service',
      status: 'operational',
      features: {
        playback_tracking: true,
        royalty_distribution: true,
        quality_streaming: true,
        analytics: true
      },
      supported_formats: ['mp3', 'flac'],
      quality_tiers: ['free', 'premium', 'hifi']
    });
  } catch (error) {
    logger.error('Error getting service status:', error);
    res.status(500).json({ error: 'Service unavailable' });
  }
});

export default router;