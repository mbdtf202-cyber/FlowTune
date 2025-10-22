import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import apiService from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useRealTimeData } from '../hooks/useWebSocket';
import { 
  User, 
  Music, 
  Share2, 
  Twitter, 
  MessageSquare, 
  Link, 
  Play, 
  Pause,
  Download,
  Heart,
  Eye,
  Calendar,
  Award,
  TrendingUp,
  Settings,
  ExternalLink,
  Wallet,
  CheckCircle,
  XCircle,
  Clock,
  Copy
} from 'lucide-react';

const UserProfile = ({ userId = 'demo_user' }) => {
  const { t } = useTranslation();
  const { user: authUser, connectWallet, disconnectWallet, isConnecting } = useAuth();
  const { connectionStatus, lastUpdate } = useRealTimeData();
  const [user, setUser] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [socialConnections, setSocialConnections] = useState({});
  const [shareStats, setShareStats] = useState({});
  const [activeTab, setActiveTab] = useState('tracks');
  const [playingTrack, setPlayingTrack] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
    loadSocialConnections();
    loadShareStats();
  }, [userId]);

  const loadUserData = async () => {
    try {
      // 在本地演示模式下使用模拟数据
      if (process.env.NODE_ENV === 'development') {
        const mockUser = {
          id: userId,
          displayName: 'Demo User',
          username: 'demo_user',
          bio: 'This is a demo user profile for testing purposes.',
          avatar: 'https://via.placeholder.com/150',
          joinDate: '2024-01-01',
          location: 'Demo City',
          website: 'https://example.com',
          badges: ['Early Adopter', 'Music Creator'],
          stats: {
            totalTracks: 5,
            totalPlays: 1250,
            totalLikes: 89,
            followers: 42,
            totalNFTs: 3,
            totalEarnings: '12.50',
            totalTransactions: 8
          }
        };

        const mockTracks = [
          {
            id: '1',
            title: 'Demo Track 1',
            genre: 'Electronic',
            coverImage: 'https://via.placeholder.com/300x200',
            createdAt: '2024-01-15',
            plays: 450,
            likes: 23,
            shares: 5,
            duration: 180,
            isPublic: true
          },
          {
            id: '2',
            title: 'Demo Track 2',
            genre: 'Ambient',
            coverImage: 'https://via.placeholder.com/300x200',
            createdAt: '2024-01-20',
            plays: 320,
            likes: 18,
            shares: 3,
            duration: 240,
            isPublic: false
          }
        ];

        setUser(mockUser);
        setTracks(mockTracks);
        setLoading(false);
        return;
      }

      // 加载用户基本信息
      const userData = await apiService.request(`/user/profile/${userId}`);
      setUser(userData.data);

      // 加载用户的音轨
      const tracksData = await apiService.request(`/nft/profile/${userId}`);
      setTracks(tracksData.data || []);

      setLoading(false);
    } catch (error) {
      console.error('Failed to load user data:', error);
      setLoading(false);
    }
  };

  const loadSocialConnections = async () => {
    try {
      // 在开发模式下使用模拟数据
      if (process.env.NODE_ENV === 'development') {
        const mockSocialConnections = {
          twitter: {
            connected: false,
            username: null
          },
          discord: {
            connected: false,
            username: null
          }
        };
        setSocialConnections(mockSocialConnections);
        return;
      }

      const data = await apiService.request(`/user/social-connections/${userId}`);
      setSocialConnections(data.data || {});
    } catch (error) {
      console.error('Failed to load social connections:', error);
      setSocialConnections({});
    }
  };

  const loadShareStats = async () => {
    try {
      // 在开发模式下使用模拟数据
      if (process.env.NODE_ENV === 'development') {
        const mockShareStats = {
          totalShares: 15,
          twitterShares: 8,
          discordShares: 7
        };
        setShareStats(mockShareStats);
        return;
      }

      const data = await apiService.request(`/analytics/share-stats/${userId}`);
      setShareStats(data.data || {});
    } catch (error) {
      console.error('Failed to load share stats:', error);
      setShareStats({});
    }
  };

  const handleShareToTwitter = async (track) => {
    try {
      const response = await window.fetch('/api/social/share/twitter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ trackData: track })
      });

      const result = await response.json();
      if (result.success) {
        alert('Successfully shared to Twitter!');
        loadShareStats(); // 刷新统计
      } else {
        alert('Failed to share to Twitter: ' + result.error);
      }
    } catch (error) {
      console.error('Twitter share error:', error);
      alert('Failed to share to Twitter');
    }
  };

  const handleShareToDiscord = async (track) => {
    try {
      const response = await window.fetch('/api/social/share/discord', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          trackData: track,
          channelInfo: { channelId: 'general' }
        })
      });

      const result = await response.json();
      if (result.success) {
        alert('Successfully shared to Discord!');
        loadShareStats(); // 刷新统计
      } else {
        alert('Failed to share to Discord: ' + result.error);
      }
    } catch (error) {
      console.error('Discord share error:', error);
      alert('Failed to share to Discord');
    }
  };

  const handleGenerateShareLink = async (track) => {
    try {
      const response = await window.fetch('/api/social/share/link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ trackId: track.id })
      });

      const result = await response.json();
      if (result.shareLink) {
        navigator.clipboard.writeText(result.shareLink);
        alert('Share link copied to clipboard!');
      }
    } catch (error) {
      console.error('Share link generation error:', error);
      alert('Failed to generate share link');
    }
  };

  const togglePlay = (track) => {
    if (playingTrack === track.id) {
      setPlayingTrack(null);
    } else {
      setPlayingTrack(track.id);
    }
  };

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // 安全渲染函数，确保值是可渲染的
  const safeRender = (value, fallback = 'N/A') => {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'object') {
      if (Array.isArray(value)) return value.length;
      return JSON.stringify(value);
    }
    return String(value);
  };

  // 安全数字渲染
  const safeNumber = (value, fallback = 0) => {
    const num = Number(value);
    return isNaN(num) ? fallback : num;
  };

  // 钱包相关功能函数
  const handleConnectWallet = async () => {
    try {
      await connectWallet();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const handleDisconnectWallet = async () => {
    try {
      await disconnectWallet();
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  };

  const copyWalletAddress = () => {
    if (authUser?.flowWallet?.address) {
      navigator.clipboard.writeText(authUser.flowWallet.address);
      // 这里可以添加一个toast通知
    }
  };

  const formatWalletAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'disconnected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'connecting':
        return <Clock className="h-4 w-4 text-yellow-500 animate-spin" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('profile.userNotFound')}</h2>
          <p className="text-gray-600">{t('profile.userNotFoundDesc')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8">
            <div className="flex items-center space-x-6">
              <img
                src={user.avatar}
                alt={user.displayName}
                className="h-24 w-24 rounded-full object-cover"
              />
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900">{safeRender(user.displayName, 'Unknown User')}</h1>
                <p className="text-lg text-gray-600">@{safeRender(user.username, 'unknown')}</p>
                <p className="text-gray-700 mt-2">{safeRender(user.bio, 'No bio available')}</p>
                <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                  <span className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {t('profile.joined')} {formatDate(user.joinDate)}
                  </span>
                  {user.location && (
                    <span>{safeRender(user.location)}</span>
                  )}
                  {user.website && (
                    <a 
                      href={safeRender(user.website)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center text-indigo-600 hover:text-indigo-800"
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      {t('profile.website')}
                    </a>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="flex flex-col space-y-2">
                  {/* 钱包状态显示 */}
                  <div className="flex items-center justify-end space-x-2 text-sm">
                    {getConnectionStatusIcon()}
                    <span className="text-gray-600">
                      {authUser?.flowWallet?.isConnected ? 'Wallet Connected' : 'Wallet Disconnected'}
                    </span>
                  </div>
                  
                  {/* 钱包地址显示 */}
                  {authUser?.flowWallet?.address && (
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Wallet className="h-4 w-4" />
                      <span>{formatWalletAddress(authUser.flowWallet.address)}</span>
                      <button
                        onClick={copyWalletAddress}
                        className="text-indigo-600 hover:text-indigo-800"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  
                  <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                    <Settings className="h-4 w-4 inline mr-2" />
                    {t('profile.editProfile')}
                  </button>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{safeNumber(user.stats?.totalTracks)}</div>
                <div className="text-sm text-gray-600">{t('profile.tracks')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{safeNumber(user.stats?.totalPlays).toLocaleString()}</div>
                <div className="text-sm text-gray-600">{t('profile.plays')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{safeNumber(user.stats?.totalLikes)}</div>
                <div className="text-sm text-gray-600">{t('profile.likes')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{safeNumber(user.stats?.followers)}</div>
                <div className="text-sm text-gray-600">{t('profile.followers')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{safeNumber(shareStats.totalShares)}</div>
                <div className="text-sm text-gray-600">{t('profile.shares')}</div>
              </div>
            </div>

            {/* Badges */}
            {user.badges && Array.isArray(user.badges) && user.badges.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {user.badges.map((badge, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                  >
                    <Award className="h-3 w-3 mr-1" />
                    {safeRender(badge)}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('tracks')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'tracks'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Music className="h-4 w-4 inline mr-2" />
              {t('profile.tracks')}
            </button>
            <button
              onClick={() => setActiveTab('social')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'social'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Share2 className="h-4 w-4 inline mr-2" />
              {t('profile.socialSharing')}
            </button>
            <button
              onClick={() => setActiveTab('wallet')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'wallet'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Wallet className="h-4 w-4 inline mr-2" />
              Wallet
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'tracks' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.isArray(tracks) && tracks.map((track) => (
              <div key={safeRender(track.id, Math.random())} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="relative">
                  <img
                    src={safeRender(track.coverImage, 'https://via.placeholder.com/300x200')}
                    alt={safeRender(track.title, 'Untitled Track')}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => togglePlay(track)}
                      className="bg-white rounded-full p-3 hover:bg-gray-100 transition-colors"
                    >
                      {playingTrack === track.id ? (
                        <Pause className="h-6 w-6 text-gray-900" />
                      ) : (
                        <Play className="h-6 w-6 text-gray-900" />
                      )}
                    </button>
                  </div>
                  {!track.isPublic && (
                    <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs">
                      {t('profile.private')}
                    </div>
                  )}
                </div>
                
                <div className="p-4">
                  <h3 className="font-semibold text-lg text-gray-900 mb-1">{safeRender(track.title, 'Untitled Track')}</h3>
                  <p className="text-gray-600 text-sm mb-2">{safeRender(track.genre, 'Unknown Genre')}</p>
                  <p className="text-gray-500 text-xs mb-3">{t('profile.created')} {formatDate(track.createdAt)}</p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                    <span className="flex items-center">
                      <Eye className="h-4 w-4 mr-1" />
                      {safeNumber(track.plays)}
                    </span>
                    <span className="flex items-center">
                      <Heart className="h-4 w-4 mr-1" />
                      {safeNumber(track.likes)}
                    </span>
                    <span className="flex items-center">
                      <Share2 className="h-4 w-4 mr-1" />
                      {safeNumber(track.shares)}
                    </span>
                    <span>{formatDuration(safeNumber(track.duration))}</span>
                  </div>

                  {/* Share buttons */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleShareToTwitter(track)}
                      className="flex-1 bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600 transition-colors flex items-center justify-center"
                    >
                      <Twitter className="h-4 w-4 mr-1" />
                      Twitter
                    </button>
                    <button
                      onClick={() => handleShareToDiscord(track)}
                      className="flex-1 bg-indigo-600 text-white px-3 py-2 rounded text-sm hover:bg-indigo-700 transition-colors flex items-center justify-center"
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Discord
                    </button>
                    <button
                      onClick={() => handleGenerateShareLink(track)}
                      className="bg-gray-500 text-white px-3 py-2 rounded text-sm hover:bg-gray-600 transition-colors"
                    >
                      <Link className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'social' && (
          <div className="space-y-8">
            {/* Social Connections */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Social Connections</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Twitter className="h-6 w-6 text-blue-500" />
                    <div>
                      <div className="font-medium">Twitter/X</div>
                      {socialConnections.twitter?.connected ? (
                        <div className="text-sm text-gray-600">{socialConnections.twitter.username}</div>
                      ) : (
                        <div className="text-sm text-gray-500">Not connected</div>
                      )}
                    </div>
                  </div>
                  <button
                    className={`px-4 py-2 rounded text-sm font-medium ${
                      socialConnections.twitter?.connected
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }`}
                  >
                    {socialConnections.twitter?.connected ? 'Disconnect' : 'Connect'}
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <MessageSquare className="h-6 w-6 text-indigo-600" />
                    <div>
                      <div className="font-medium">Discord</div>
                      {socialConnections.discord?.connected ? (
                        <div className="text-sm text-gray-600">{socialConnections.discord.username}</div>
                      ) : (
                        <div className="text-sm text-gray-500">Not connected</div>
                      )}
                    </div>
                  </div>
                  <button
                    className={`px-4 py-2 rounded text-sm font-medium ${
                      socialConnections.discord?.connected
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                    }`}
                  >
                    {socialConnections.discord?.connected ? 'Disconnect' : 'Connect'}
                  </button>
                </div>
              </div>
            </div>

            {/* Share Statistics */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Share Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{safeNumber(shareStats.totalShares)}</div>
                  <div className="text-sm text-gray-600">Total Shares</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{safeNumber(shareStats.twitterShares)}</div>
                  <div className="text-sm text-gray-600">Twitter Shares</div>
                </div>
                <div className="text-center p-4 bg-indigo-50 rounded-lg">
                  <div className="text-2xl font-bold text-indigo-600">{safeNumber(shareStats.discordShares)}</div>
                  <div className="text-sm text-gray-600">Discord Shares</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'wallet' && (
          <div className="space-y-8">
            {/* Wallet Connection */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Wallet Connection</h3>
              
              {!authUser?.flowWallet?.isConnected ? (
                <div className="text-center py-8">
                  <Wallet className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">Connect Your Wallet</h4>
                  <p className="text-gray-600 mb-6">Connect your Flow wallet to manage your NFTs and transactions</p>
                  <button
                    onClick={handleConnectWallet}
                    disabled={isConnecting}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isConnecting ? (
                      <>
                        <Clock className="h-4 w-4 inline mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Wallet className="h-4 w-4 inline mr-2" />
                        Connect Wallet
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-6 w-6 text-green-500" />
                      <div>
                        <div className="font-medium text-green-900">Wallet Connected</div>
                        <div className="text-sm text-green-700">Your Flow wallet is successfully connected</div>
                      </div>
                    </div>
                    <button
                      onClick={handleDisconnectWallet}
                      className="bg-red-100 text-red-700 px-4 py-2 rounded text-sm font-medium hover:bg-red-200"
                    >
                      Disconnect
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Wallet Address</div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-sm">{authUser.flowWallet.address}</span>
                        <button
                          onClick={copyWalletAddress}
                          className="text-indigo-600 hover:text-indigo-800"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Connection Status</div>
                      <div className="flex items-center space-x-2">
                        {getConnectionStatusIcon()}
                        <span className="text-sm font-medium">
                          {connectionStatus === 'connected' ? 'Connected' : 
                           connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
                        </span>
                      </div>
                      {lastUpdate && (
                        <div className="text-xs text-gray-500 mt-1">
                          Last update: {new Date(lastUpdate).toLocaleTimeString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Wallet Statistics */}
            {authUser?.flowWallet?.isConnected && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Wallet Statistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{safeNumber(user?.stats?.totalNFTs)}</div>
                    <div className="text-sm text-gray-600">Total NFTs</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{safeRender(user?.stats?.totalEarnings, '0.00')} FLOW</div>
                    <div className="text-sm text-gray-600">Total Earnings</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{safeNumber(user?.stats?.totalTransactions)}</div>
                    <div className="text-sm text-gray-600">Transactions</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default UserProfile;