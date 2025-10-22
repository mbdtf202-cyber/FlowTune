import React, { useState, useEffect } from 'react';
import { Users, Music, Heart, TrendingUp, Activity, Headphones } from 'lucide-react';
import websocketService from '../services/websocketService';

const RealTimeStats = ({ className = '' }) => {
  const [stats, setStats] = useState({
    onlineUsers: 0,
    totalTracks: 0,
    totalLikes: 0,
    activeListeners: 0,
    trendsData: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 监听实时统计更新
    const handleStatsUpdate = (data) => {
      setStats(prev => ({
        ...prev,
        ...data
      }));
    };

    // 监听市场数据更新
    websocketService.onMarketUpdate(handleStatsUpdate);

    // 模拟初始统计数据
    const mockStats = {
      onlineUsers: 1247,
      totalTracks: 15623,
      totalLikes: 89456,
      activeListeners: 892,
      trendsData: [
        { genre: 'Electronic', count: 234, change: '+12%' },
        { genre: 'Jazz', count: 189, change: '+8%' },
        { genre: 'Rock', count: 156, change: '+5%' },
        { genre: 'Classical', count: 134, change: '+3%' }
      ]
    };

    setStats(mockStats);
    setIsLoading(false);

    // 模拟实时数据更新
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        onlineUsers: prev.onlineUsers + Math.floor(Math.random() * 10 - 5),
        activeListeners: prev.activeListeners + Math.floor(Math.random() * 20 - 10),
        totalLikes: prev.totalLikes + Math.floor(Math.random() * 5)
      }));
    }, 5000);

    return () => {
      clearInterval(interval);
      websocketService.off('market_data_updated', handleStatsUpdate);
    };
  }, []);

  const StatCard = ({ icon: Icon, title, value, change, color = 'blue' }) => {
    const colorClasses = {
      blue: 'bg-blue-50 text-blue-600 border-blue-200',
      green: 'bg-green-50 text-green-600 border-green-200',
      purple: 'bg-purple-50 text-purple-600 border-purple-200',
      orange: 'bg-orange-50 text-orange-600 border-orange-200'
    };

    return (
      <div className={`p-4 rounded-lg border ${colorClasses[color]}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold mt-1">{value.toLocaleString()}</p>
            {change && (
              <p className="text-xs mt-1 flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" />
                {change}
              </p>
            )}
          </div>
          <Icon className="w-8 h-8 opacity-80" />
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <h3 className="text-lg font-semibold mb-4">Real-time Statistics</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-4 rounded-lg border bg-gray-50 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      <div className="p-6 border-b">
        <h3 className="text-lg font-semibold flex items-center">
          <Activity className="w-5 h-5 mr-2 text-green-500" />
          Real-time Statistics
        </h3>
      </div>
      
      <div className="p-6">
        {/* Main Statistics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={Users}
            title="Online Users"
            value={stats.onlineUsers}
            change="+5.2%"
            color="blue"
          />
          <StatCard
            icon={Music}
            title="Music Tracks"
            value={stats.totalTracks}
            change="+12.8%"
            color="green"
          />
          <StatCard
            icon={Heart}
            title="Total Likes"
            value={stats.totalLikes}
            change="+8.4%"
            color="purple"
          />
          <StatCard
            icon={Headphones}
            title="Active Listeners"
            value={stats.activeListeners}
            change="+15.6%"
            color="orange"
          />
        </div>

        {/* Trending Topics */}
        <div>
          <h4 className="text-md font-semibold mb-3 flex items-center">
            <TrendingUp className="w-4 h-4 mr-2 text-yellow-500" />
            Trending Topics
          </h4>
          <div className="space-y-2">
            {stats.trendsData.map((trend, index) => (
              <div key={trend.genre} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-3">
                  <span className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="font-medium text-gray-900">{trend.genre}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600">{trend.count} tracks</span>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    {trend.change}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Real-time Activity Indicator */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              Live Updates
            </span>
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeStats;