import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, Users, Activity, 
  Brain, AlertCircle, Info, Target, Zap 
} from 'lucide-react';

const AdvancedDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 60000); // 每分钟更新
    return () => clearInterval(interval);
  }, [selectedTimeframe]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await window.fetch('http://localhost:3002/api/analytics/dashboard');
      const result = await response.json();
      
      if (result.success) {
        setDashboardData(result.data);
        setError(null);
      } else {
        setError(result.error || 'Failed to fetch data');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(2);
  };

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(num);
  };

  const getChangeColor = (change) => {
    if (typeof change === 'string') {
      return change.startsWith('+') ? 'text-green-500' : 'text-red-500';
    }
    return change > 0 ? 'text-green-500' : 'text-red-500';
  };

  const getChangeIcon = (change) => {
    if (typeof change === 'string') {
      return change.startsWith('+') ? TrendingUp : TrendingDown;
    }
    return change > 0 ? TrendingUp : TrendingDown;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <p className="mt-4 text-red-600">Error: {error}</p>
          <button 
            onClick={fetchDashboardData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { blockchain, nft, musicNFT, aiInsights } = dashboardData;

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            FlowTune Analytics Dashboard
          </h1>
          <p className="text-gray-600">
            Real-time blockchain data monitoring and AI insights analysis
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', name: '概览', icon: Activity },
                { id: 'blockchain', name: '区块链', icon: Zap },
                { id: 'nft', name: 'NFT市场', icon: DollarSign },
                { id: 'music', name: '音乐NFT', icon: Users },
                { id: 'insights', name: 'AI洞察', icon: Brain }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">总交易量</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatNumber(blockchain.totalTransactions)}
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-blue-500" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">日活用户</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatNumber(blockchain.dailyActiveUsers)}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-green-500" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">NFT日交易量</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(nft.dailyVolume)}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-yellow-500" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">音乐NFT日铸造</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {musicNFT.dailyMints}
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-purple-500" />
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">交易趋势</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={blockchain.chartData.transactions}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => [formatNumber(value), '交易量']} />
                    <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">NFT交易量</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={nft.chartData.volume}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => [formatCurrency(value), '交易量']} />
                    <Area type="monotone" dataKey="value" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Music NFT Tab */}
        {activeTab === 'music' && (
          <div className="space-y-6">
            {/* Music Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">总音乐NFT</h3>
                <p className="text-3xl font-bold text-blue-600">{formatNumber(musicNFT.totalMusicNFTs)}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">艺术家总数</h3>
                <p className="text-3xl font-bold text-green-600">{formatNumber(musicNFT.totalArtists)}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">总版税收入</h3>
                <p className="text-3xl font-bold text-purple-600">{formatCurrency(musicNFT.totalRoyalties)}</p>
              </div>
            </div>

            {/* Genre Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">音乐类型分布</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={musicNFT.topGenres}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ genre, percentage }) => `${genre} ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {musicNFT.topGenres?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">最近活动</h3>
                <div className="space-y-3">
                  {musicNFT.recentActivity?.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{activity.title}</p>
                        <p className="text-sm text-gray-600">by {activity.artist}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          {activity.type === 'royalty' ? formatCurrency(activity.amount) : formatCurrency(activity.price)}
                        </p>
                        <p className="text-sm text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Insights Tab */}
        {activeTab === 'insights' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center space-x-2 mb-4">
                <Brain className="h-6 w-6 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">AI 市场洞察</h3>
              </div>
              
              {aiInsights && aiInsights.insights && (
                <div className="space-y-6">
                  {aiInsights.insights.map((insight, index) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4">
                      <h4 className="font-semibold text-gray-900 mb-2">{insight.title}</h4>
                      <p className="text-gray-700 mb-2">{insight.content}</p>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span>置信度: {Math.round(insight.confidence * 100)}%</span>
                        <span>•</span>
                        <span>Type: {insight.type}</span>
                      </div>
                    </div>
                  ))}
                  
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Summary</h4>
                    <p className="text-blue-800">{aiInsights.summary}</p>
                    <p className="text-sm text-blue-600 mt-2">
                      Updated: {new Date(aiInsights.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Data updated: {new Date(dashboardData.lastUpdated).toLocaleString()}</p>
          <p className="mt-1">FlowTune Analytics Dashboard v1.0</p>
        </div>
      </div>
    </div>
  );
};

export default AdvancedDashboard;