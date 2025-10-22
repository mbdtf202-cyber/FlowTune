import axios from 'axios';
import crypto from 'crypto';
import database from '../config/database.js';

class SocialService {
  constructor() {
    this.twitterApiKey = process.env.TWITTER_API_KEY || 'demo_twitter_key';
    this.twitterApiSecret = process.env.TWITTER_API_SECRET || 'demo_twitter_secret';
    this.discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL || 'https://discord.com/api/webhooks/demo';
    this.baseUrl = process.env.BASE_URL || 'http://localhost:3002';
  }

  // 生成分享链接
  generateShareLink(trackId, userId) {
    const shareId = crypto.randomUUID();
    const shareLink = `${this.baseUrl}/share/${shareId}`;
    
    // 存储分享信息到数据库
    const shareData = {
      shareId,
      trackId,
      userId,
      shareLink,
      createdAt: new Date().toISOString(),
      clicks: 0,
      platform: 'direct'
    };
    
    database.setData(`share:${shareId}`, shareData);
    return shareData;
  }

  // 分享到 Twitter/X
  async shareToTwitter(trackData, userId) {
    try {
      const shareData = this.generateShareLink(trackData.id, userId);
      
      // 构建推文内容
      const tweetText = this.buildTweetText(trackData, shareData.shareLink);
      
      // 模拟 Twitter API 调用（实际项目中需要使用真实的 Twitter API）
      const twitterResponse = await this.mockTwitterPost(tweetText, trackData);
      
      // 记录分享活动
      await this.recordShareActivity(userId, trackData.id, 'twitter', shareData.shareId);
      
      return {
        success: true,
        platform: 'twitter',
        shareId: shareData.shareId,
        shareLink: shareData.shareLink,
        tweetUrl: twitterResponse.tweetUrl,
        message: 'Successfully shared to Twitter/X'
      };
    } catch (error) {
      console.error('Twitter share error:', error);
      return {
        success: false,
        platform: 'twitter',
        error: error.message
      };
    }
  }

  // 分享到 Discord
  async shareToDiscord(trackData, userId, channelInfo = null) {
    try {
      const shareData = this.generateShareLink(trackData.id, userId);
      
      // 构建 Discord 嵌入消息
      const discordEmbed = this.buildDiscordEmbed(trackData, shareData.shareLink);
      
      // 发送到 Discord Webhook
      const discordResponse = await this.sendDiscordWebhook(discordEmbed, channelInfo);
      
      // 记录分享活动
      await this.recordShareActivity(userId, trackData.id, 'discord', shareData.shareId);
      
      return {
        success: true,
        platform: 'discord',
        shareId: shareData.shareId,
        shareLink: shareData.shareLink,
        messageId: discordResponse.messageId,
        message: 'Successfully shared to Discord'
      };
    } catch (error) {
      console.error('Discord share error:', error);
      return {
        success: false,
        platform: 'discord',
        error: error.message
      };
    }
  }

  // 构建推文文本
  buildTweetText(trackData, shareLink) {
    const hashtags = ['#FlowTune', '#AIMusic', '#Web3Music'];
    const text = `🎵 Check out my new track "${trackData.title}" created with FlowTune AI! 
    
🎨 Genre: ${trackData.genre}
⏱️ Duration: ${this.formatDuration(trackData.duration)}
🤖 AI-Generated with love

Listen now: ${shareLink}

${hashtags.join(' ')}`;
    
    return text;
  }

  // 构建 Discord 嵌入消息
  buildDiscordEmbed(trackData, shareLink) {
    return {
      embeds: [{
        title: `🎵 New Track: ${trackData.title}`,
        description: `Check out this amazing AI-generated track on FlowTune!`,
        color: 0x6366f1, // Indigo color
        fields: [
          {
            name: '🎨 Genre',
            value: trackData.genre,
            inline: true
          },
          {
            name: '⏱️ Duration',
            value: this.formatDuration(trackData.duration),
            inline: true
          },
          {
            name: '👤 Artist',
            value: trackData.artist || 'FlowTune User',
            inline: true
          }
        ],
        thumbnail: {
          url: trackData.coverImage || 'https://via.placeholder.com/300x300?text=FlowTune'
        },
        footer: {
          text: 'FlowTune - AI Music Generation Platform',
          icon_url: 'https://via.placeholder.com/32x32?text=FT'
        },
        timestamp: new Date().toISOString(),
        url: shareLink
      }],
      components: [{
        type: 1,
        components: [{
          type: 2,
          style: 5,
          label: '🎧 Listen Now',
          url: shareLink
        }]
      }]
    };
  }

  // 模拟 Twitter API 调用
  async mockTwitterPost(tweetText, trackData) {
    // 在实际项目中，这里会调用真实的 Twitter API
    console.log('Mock Twitter post:', tweetText);
    
    return {
      tweetId: `mock_tweet_${Date.now()}`,
      tweetUrl: `https://twitter.com/user/status/mock_tweet_${Date.now()}`,
      text: tweetText
    };
  }

  // 发送 Discord Webhook
  async sendDiscordWebhook(embedData, channelInfo) {
    try {
      // 在实际项目中，这里会调用真实的 Discord Webhook
      console.log('Mock Discord webhook:', embedData);
      
      return {
        messageId: `mock_discord_${Date.now()}`,
        channelId: channelInfo?.channelId || 'mock_channel'
      };
    } catch (error) {
      throw new Error(`Discord webhook failed: ${error.message}`);
    }
  }

  // 记录分享活动
  async recordShareActivity(userId, trackId, platform, shareId) {
    const activity = {
      id: crypto.randomUUID(),
      userId,
      trackId,
      platform,
      shareId,
      timestamp: new Date().toISOString(),
      type: 'share'
    };
    
    // 存储到数据库
    database.setData(`activity:${activity.id}`, activity);
    
    // 更新用户分享统计
    const userStats = database.getData(`user_stats:${userId}`) || { shares: 0 };
    userStats.shares = (userStats.shares || 0) + 1;
    userStats[`${platform}_shares`] = (userStats[`${platform}_shares`] || 0) + 1;
    database.setData(`user_stats:${userId}`, userStats);
    
    return activity;
  }

  // 获取分享统计
  async getShareStats(userId, timeRange = '7d') {
    const userStats = database.getData(`user_stats:${userId}`) || {};
    
    return {
      totalShares: userStats.shares || 0,
      twitterShares: userStats.twitter_shares || 0,
      discordShares: userStats.discord_shares || 0,
      platforms: {
        twitter: userStats.twitter_shares || 0,
        discord: userStats.discord_shares || 0
      },
      timeRange
    };
  }

  // 获取分享链接点击统计
  async getShareLinkStats(shareId) {
    const shareData = database.getData(`share:${shareId}`);
    if (!shareData) {
      throw new Error('Share link not found');
    }
    
    return {
      shareId,
      clicks: shareData.clicks || 0,
      createdAt: shareData.createdAt,
      platform: shareData.platform,
      trackId: shareData.trackId
    };
  }

  // 处理分享链接点击
  async handleShareLinkClick(shareId, referrer = null) {
    const shareData = database.getData(`share:${shareId}`);
    if (!shareData) {
      throw new Error('Share link not found');
    }
    
    // 增加点击计数
    shareData.clicks = (shareData.clicks || 0) + 1;
    shareData.lastClickAt = new Date().toISOString();
    if (referrer) {
      shareData.referrer = referrer;
    }
    
    database.setData(`share:${shareId}`, shareData);
    
    return shareData;
  }

  // 获取热门分享内容
  async getTrendingShares(limit = 10) {
    // 模拟热门分享数据
    return [
      {
        trackId: 'track_1',
        title: 'Cosmic Dreams',
        artist: 'AI Composer',
        shares: 156,
        clicks: 1240,
        platforms: ['twitter', 'discord']
      },
      {
        trackId: 'track_2',
        title: 'Digital Symphony',
        artist: 'Neural Network',
        shares: 89,
        clicks: 670,
        platforms: ['twitter']
      }
    ];
  }

  // 格式化时长
  formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  // 获取社交平台连接状态
  async getSocialConnections(userId) {
    const connections = database.getData(`social_connections:${userId}`) || {};
    
    return {
      twitter: {
        connected: !!connections.twitter,
        username: connections.twitter?.username || null,
        lastSync: connections.twitter?.lastSync || null
      },
      discord: {
        connected: !!connections.discord,
        username: connections.discord?.username || null,
        serverId: connections.discord?.serverId || null,
        lastSync: connections.discord?.lastSync || null
      }
    };
  }

  // 连接社交平台账户
  async connectSocialAccount(userId, platform, accountData) {
    const connections = database.getData(`social_connections:${userId}`) || {};
    
    connections[platform] = {
      ...accountData,
      connectedAt: new Date().toISOString(),
      lastSync: new Date().toISOString()
    };
    
    database.setData(`social_connections:${userId}`, connections);
    
    return {
      success: true,
      platform,
      message: `Successfully connected ${platform} account`
    };
  }
}

export default new SocialService();