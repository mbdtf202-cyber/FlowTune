/**
 * 音频流媒体服务
 * 处理高级音频预览、播放计次统计和分润机制
 */

import database from '../config/database.js';
import logger from '../utils/logger.js';

class AudioStreamingService {
  constructor() {
    this.db = database;
    this.playCountThreshold = 30; // 30秒播放计为一次有效播放
    this.royaltyRates = {
      artist: 0.7,      // 艺术家70%
      platform: 0.2,    // 平台20%
      curator: 0.1       // 策展人10%
    };
  }

  /**
   * 记录播放开始
   */
  async startPlayback(userId, trackId, sessionId) {
    try {
      const playSession = {
        userId,
        trackId,
        sessionId,
        startTime: Date.now(),
        duration: 0,
        isValid: false,
        ipAddress: null,
        userAgent: null
      };

      await this.db.set(`play_session:${sessionId}`, JSON.stringify(playSession), 3600);
      
      logger.info(`Playback started for track ${trackId} by user ${userId}`);
      return { success: true, sessionId };
    } catch (error) {
      logger.error('Error starting playback:', error);
      throw error;
    }
  }

  /**
   * 更新播放进度
   */
  async updatePlaybackProgress(sessionId, currentTime, totalDuration) {
    try {
      const sessionData = await this.db.get(`play_session:${sessionId}`);
      if (!sessionData) {
        throw new Error('Play session not found');
      }

      const session = JSON.parse(sessionData);
      session.duration = currentTime;
      session.totalDuration = totalDuration;
      
      // 检查是否达到有效播放阈值
      if (currentTime >= this.playCountThreshold && !session.isValid) {
        session.isValid = true;
        await this.recordValidPlay(session);
      }

      await this.db.set(`play_session:${sessionId}`, JSON.stringify(session), 3600);
      
      return { success: true, isValid: session.isValid };
    } catch (error) {
      logger.error('Error updating playback progress:', error);
      throw error;
    }
  }

  /**
   * 结束播放会话
   */
  async endPlayback(sessionId) {
    try {
      const sessionData = await this.db.get(`play_session:${sessionId}`);
      if (!sessionData) {
        return { success: true };
      }

      const session = JSON.parse(sessionData);
      session.endTime = Date.now();
      
      // 如果是有效播放，触发分润
      if (session.isValid) {
        await this.processRoyalties(session);
      }

      // 清理会话数据
      await this.db.del(`play_session:${sessionId}`);
      
      logger.info(`Playback ended for session ${sessionId}`);
      return { success: true, wasValid: session.isValid };
    } catch (error) {
      logger.error('Error ending playback:', error);
      throw error;
    }
  }

  /**
   * 记录有效播放
   */
  async recordValidPlay(session) {
    try {
      const { trackId, userId } = session;
      const today = new Date().toISOString().split('T')[0];
      
      // 增加总播放次数
      await this.db.incr(`track_plays:${trackId}`);
      await this.db.incr(`track_plays:${trackId}:${today}`);
      
      // 增加用户播放次数
      await this.db.incr(`user_plays:${userId}`);
      await this.db.incr(`user_plays:${userId}:${today}`);
      
      // 记录播放历史
      const playRecord = {
        trackId,
        userId,
        timestamp: Date.now(),
        date: today,
        sessionId: session.sessionId
      };
      
      await this.db.sadd(`play_history:${userId}`, JSON.stringify(playRecord));
      await this.db.sadd(`track_listeners:${trackId}`, userId);
      
      logger.info(`Valid play recorded for track ${trackId}`);
    } catch (error) {
      logger.error('Error recording valid play:', error);
      throw error;
    }
  }

  /**
   * 处理分润
   */
  async processRoyalties(session) {
    try {
      const { trackId } = session;
      
      // 获取音轨信息
      const trackInfo = await this.getTrackInfo(trackId);
      if (!trackInfo) {
        logger.warn(`Track info not found for ${trackId}`);
        return;
      }

      const baseRevenue = 0.001; // 每次播放基础收益（示例值）
      
      // 计算分润
      const royalties = {
        artist: baseRevenue * this.royaltyRates.artist,
        platform: baseRevenue * this.royaltyRates.platform,
        curator: baseRevenue * this.royaltyRates.curator
      };

      // 记录分润
      await this.recordRoyalties(trackId, trackInfo.artistId, royalties);
      
      logger.info(`Royalties processed for track ${trackId}:`, royalties);
    } catch (error) {
      logger.error('Error processing royalties:', error);
      throw error;
    }
  }

  /**
   * 记录分润信息
   */
  async recordRoyalties(trackId, artistId, royalties) {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // 累计艺术家收益
      await this.db.incr(`artist_earnings:${artistId}`, royalties.artist);
      await this.db.incr(`artist_earnings:${artistId}:${today}`, royalties.artist);
      
      // 累计平台收益
      await this.db.incr(`platform_earnings:${today}`, royalties.platform);
      
      // 记录详细分润记录
      const royaltyRecord = {
        trackId,
        artistId,
        timestamp: Date.now(),
        date: today,
        royalties
      };
      
      await this.db.sadd(`royalty_records:${artistId}`, JSON.stringify(royaltyRecord));
    } catch (error) {
      logger.error('Error recording royalties:', error);
      throw error;
    }
  }

  /**
   * 获取音轨播放统计
   */
  async getTrackStats(trackId) {
    try {
      const totalPlays = await this.db.get(`track_plays:${trackId}`) || 0;
      const today = new Date().toISOString().split('T')[0];
      const todayPlays = await this.db.get(`track_plays:${trackId}:${today}`) || 0;
      
      const listeners = await this.db.smembers(`track_listeners:${trackId}`);
      const uniqueListeners = listeners.length;
      
      return {
        totalPlays: parseInt(totalPlays),
        todayPlays: parseInt(todayPlays),
        uniqueListeners,
        averageListensPerUser: uniqueListeners > 0 ? totalPlays / uniqueListeners : 0
      };
    } catch (error) {
      logger.error('Error getting track stats:', error);
      throw error;
    }
  }

  /**
   * 获取用户播放历史
   */
  async getUserPlayHistory(userId, limit = 50) {
    try {
      const historyData = await this.db.smembers(`play_history:${userId}`);
      const history = historyData
        .map(data => JSON.parse(data))
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit);
      
      return history;
    } catch (error) {
      logger.error('Error getting user play history:', error);
      throw error;
    }
  }

  /**
   * 获取艺术家收益统计
   */
  async getArtistEarnings(artistId) {
    try {
      const totalEarnings = await this.db.get(`artist_earnings:${artistId}`) || 0;
      const today = new Date().toISOString().split('T')[0];
      const todayEarnings = await this.db.get(`artist_earnings:${artistId}:${today}`) || 0;
      
      const royaltyRecords = await this.db.smembers(`royalty_records:${artistId}`);
      const recentRecords = royaltyRecords
        .map(data => JSON.parse(data))
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 10);
      
      return {
        totalEarnings: parseFloat(totalEarnings),
        todayEarnings: parseFloat(todayEarnings),
        recentRecords
      };
    } catch (error) {
      logger.error('Error getting artist earnings:', error);
      throw error;
    }
  }

  /**
   * 获取音轨信息（模拟）
   */
  async getTrackInfo(trackId) {
    try {
      // 在实际应用中，这里会从数据库获取音轨信息
      // 这里使用模拟数据
      const mockTracks = {
        'track_1': { artistId: 'artist_1', title: 'Sample Track 1', genre: 'Electronic' },
        'track_2': { artistId: 'artist_2', title: 'Sample Track 2', genre: 'Hip Hop' },
        'track_3': { artistId: 'artist_1', title: 'Sample Track 3', genre: 'Jazz' }
      };
      
      return mockTracks[trackId] || null;
    } catch (error) {
      logger.error('Error getting track info:', error);
      throw error;
    }
  }

  /**
   * 获取流媒体质量配置
   */
  getStreamingQuality(userTier = 'free') {
    const qualityConfigs = {
      free: {
        bitrate: 128,
        format: 'mp3',
        maxDuration: 30 // 免费用户只能听30秒预览
      },
      premium: {
        bitrate: 320,
        format: 'mp3',
        maxDuration: null // 无限制
      },
      hifi: {
        bitrate: 1411,
        format: 'flac',
        maxDuration: null
      }
    };
    
    return qualityConfigs[userTier] || qualityConfigs.free;
  }

  /**
   * 生成流媒体URL
   */
  generateStreamUrl(trackId, userId, quality = 'free') {
    const config = this.getStreamingQuality(quality);
    const sessionId = `${userId}_${trackId}_${Date.now()}`;
    
    return {
      streamUrl: `/api/audio/stream/${trackId}?quality=${quality}&session=${sessionId}`,
      sessionId,
      config
    };
  }
}

export default AudioStreamingService;