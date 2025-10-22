import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, 
  Database, 
  Zap, 
  TrendingUp, 
  Users, 
  DollarSign,
  Clock,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react';

const QuickNodeDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentEvents, setRecentEvents] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [analytics, setAnalytics] = useState(null);
  const [timeframe, setTimeframe] = useState('24h');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  // 获取QuickNode状态
  const fetchQuickNodeStatus = async () => {
    try {
      const response = await window.fetch('/api/quicknode/status');
      const data = await response.json();
      
      if (data.success) {
        setConnectionStatus(data.data.connection_status);
      }
    } catch (error) {
      console.error('Failed to fetch QuickNode status:', error);
      setConnectionStatus('error');
    }
  };

  // 获取区块链统计信息
  const fetchStats = async () => {
    try {
      const response = await window.fetch('/api/quicknode/stats');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch blockchain stats:', error);
      setError('获取统计信息失败');
    }
  };

  // 获取最近事件
  const fetchRecentEvents = async () => {
    try {
      const response = await window.fetch('/api/quicknode/events/recent?limit=20');
      const data = await response.json();
      
      if (data.success) {
        setRecentEvents(data.data.events);
      }
    } catch (error) {
      console.error('Failed to fetch recent events:', error);
    }
  };

  // 获取分析数据
  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await window.fetch(`/api/quicknode/analytics/dashboard?timeframe=${timeframe}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  };

  // 初始化数据
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchQuickNodeStatus(),
        fetchStats(),
        fetchRecentEvents(),
        fetchAnalytics()
      ]);
      setLoading(false);
    };

    loadData();

    // 设置定时刷新 - 优化为2分钟间隔
    const startPolling = () => {
      intervalRef.current = setInterval(() => {
        // 只在页面可见时进行轮询
        if (!document.hidden) {
          fetchQuickNodeStatus();
          fetchStats();
          fetchRecentEvents();
        }
      }, 120000); // 2分钟刷新一次
    };

    // 页面可见性变化处理
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // 页面隐藏时停止轮询
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      } else {
        // 页面显示时重新开始轮询并立即刷新一次
        fetchQuickNodeStatus();
        fetchStats();
        fetchRecentEvents();
        startPolling();
      }
    };

    startPolling();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // 时间范围变化时重新获取分析数据
  useEffect(() => {
    fetchAnalytics();
  }, [timeframe]);

  // 手动刷新
  const handleRefresh = async () => {
    setLoading(true);
    await Promise.all([
      fetchQuickNodeStatus(),
      fetchStats(),
      fetchRecentEvents(),
      fetchAnalytics()
    ]);
    setLoading(false);
  };

  // 格式化时间
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  // 格式化数字
  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num?.toString() || '0';
  };

  // 获取连接状态样式
  const getStatusStyle = (status) => {
    switch (status) {
      case 'connected':
        return 'text-green-600 bg-green-100';
      case 'disconnected':
        return 'text-yellow-600 bg-yellow-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // 获取连接状态图标
  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-4 h-4" />;
      case 'disconnected':
        return <Clock className="w-4 h-4" />;
      case 'error':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <RefreshCw className="w-4 h-4" />;
    }
  };

  // 获取事件类型样式
  const getEventTypeStyle = (eventType) => {
    switch (eventType) {
      case 'transfer':
        return 'bg-blue-100 text-blue-800';
      case 'royalty':
        return 'bg-green-100 text-green-800';
      case 'block':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-6 h-6 animate-spin text-purple-600" />
          <span className="text-gray-600">Loading QuickNode data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">QuickNode Monitoring Dashboard</h2>
          <p className="text-gray-600">Real-time blockchain data and event monitoring</p>
        </div>
        <div className="flex items-center space-x-4">
          {/* 连接状态 */}
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${getStatusStyle(connectionStatus)}`}>
            {getStatusIcon(connectionStatus)}
            <span className="text-sm font-medium">
              {connectionStatus === 'connected' ? 'Connected' : 
               connectionStatus === 'disconnected' ? 'Disconnected' : 'Connection Error'}
            </span>
          </div>
          
          {/* 刷新按钮 */}
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Blocks</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(stats.blocks?.total_blocks)}
                </p>
              </div>
              <Database className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Latest Block: #{stats.blocks?.latest_block}
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total NFTs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(stats.nfts?.total_nfts)}
                </p>
              </div>
              <Activity className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Minted: {stats.nfts?.minted_nfts}
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Royalty Payments</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(stats.royalties?.total_payments)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Total Amount: {stats.royalties?.total_amount || 0} FLOW
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">连接状态</p>
                <p className="text-2xl font-bold text-gray-900">
                  {connectionStatus === 'connected' ? '正常' : '异常'}
                </p>
              </div>
              <Zap className="w-8 h-8 text-yellow-600" />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              实时监控中
            </p>
          </div>
        </div>
      )}

      {/* 分析数据 */}
      {analytics && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">区块链分析</h3>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="1h">过去1小时</option>
              <option value="24h">过去24小时</option>
              <option value="7d">过去7天</option>
              <option value="30d">过去30天</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2" />
                NFT活动
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">总转移</span>
                  <span className="font-medium">{analytics.nft_activity?.total_transfers || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">独特NFT</span>
                  <span className="font-medium">{analytics.nft_activity?.unique_nfts || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">独特买家</span>
                  <span className="font-medium">{analytics.nft_activity?.unique_buyers || 0}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 flex items-center">
                <DollarSign className="w-4 h-4 mr-2" />
                版税指标
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">总支付</span>
                  <span className="font-medium">{analytics.royalty_metrics?.total_payments || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">总金额</span>
                  <span className="font-medium">{analytics.royalty_metrics?.total_amount || 0} FLOW</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">平均金额</span>
                  <span className="font-medium">{analytics.royalty_metrics?.average_amount || 0} FLOW</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 flex items-center">
                <BarChart3 className="w-4 h-4 mr-2" />
                区块指标
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">总区块</span>
                  <span className="font-medium">{analytics.block_metrics?.total_blocks || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">平均交易</span>
                  <span className="font-medium">{analytics.block_metrics?.avg_transactions_per_block || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">最新区块</span>
                  <span className="font-medium">#{analytics.block_metrics?.latest_block_number || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 最近事件 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">最近事件</h3>
        
        {recentEvents.length > 0 ? (
          <div className="space-y-3">
            {recentEvents.map((event, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEventTypeStyle(event.event_type)}`}>
                    {event.event_type === 'transfer' ? '转移' : 
                     event.event_type === 'royalty' ? '版税' : '区块'}
                  </span>
                  
                  <div className="text-sm">
                    {event.event_type === 'transfer' && (
                      <span>NFT #{event.token_id} 从 {event.from_address?.slice(0, 8)}... 转移到 {event.to_address?.slice(0, 8)}...</span>
                    )}
                    {event.event_type === 'royalty' && (
                      <span>NFT #{event.token_id} 支付版税 {event.amount} FLOW 给 {event.recipient_address?.slice(0, 8)}...</span>
                    )}
                    {event.event_type === 'block' && (
                      <span>新区块 #{event.block_number} 包含 {event.transaction_count} 笔交易</span>
                    )}
                  </div>
                </div>
                
                <div className="text-xs text-gray-500">
                  {formatTime(event.timestamp)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>暂无最近事件</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickNodeDashboard;