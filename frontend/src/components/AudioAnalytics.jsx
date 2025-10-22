import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, DollarSign, Play, Clock, Award, Download } from 'lucide-react';

const AudioAnalytics = ({ artistId, className = '' }) => {
  const [stats, setStats] = useState(null);
  const [earnings, setEarnings] = useState(null);
  const [playHistory, setPlayHistory] = useState([]);
  const [trendingTracks, setTrendingTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('7d');

  // 获取统计数据
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // 获取收益数据
      if (artistId) {
        const earningsResponse = await window.fetch(`/api/audio/earnings/artist/${artistId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (earningsResponse.ok) {
          const earningsData = await earningsResponse.json();
          setEarnings(earningsData.earnings);
        }
      }

      // 获取播放历史
      const historyResponse = await window.fetch('/api/audio/history/user', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setPlayHistory(historyData.history);
      }

      // 获取热门音轨
      const trendingResponse = await window.fetch(`/api/audio/trending?timeframe=${timeframe}`);
      if (trendingResponse.ok) {
        const trendingData = await trendingResponse.json();
        setTrendingTracks(trendingData.tracks);
      }

      // 模拟综合统计数据
      setStats({
        totalPlays: 45678,
        uniqueListeners: 12345,
        totalRevenue: 234.56,
        averagePlayDuration: 142,
        topGenres: [
          { name: 'Electronic', plays: 15420, percentage: 34 },
          { name: 'Hip Hop', plays: 12890, percentage: 28 },
          { name: 'Jazz', plays: 9876, percentage: 22 },
          { name: 'Rock', plays: 7492, percentage: 16 }
        ],
        dailyPlays: [
          { date: '2024-01-01', plays: 1200, revenue: 1.2 },
          { date: '2024-01-02', plays: 1350, revenue: 1.35 },
          { date: '2024-01-03', plays: 1100, revenue: 1.1 },
          { date: '2024-01-04', plays: 1450, revenue: 1.45 },
          { date: '2024-01-05', plays: 1600, revenue: 1.6 },
          { date: '2024-01-06', plays: 1380, revenue: 1.38 },
          { date: '2024-01-07', plays: 1520, revenue: 1.52 }
        ]
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [artistId, timeframe]);

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const COLORS = ['#8B5CF6', '#EC4899', '#10B981', '#F59E0B'];

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      {/* 标题和时间范围选择 */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Audio Analytics</h2>
        <div className="flex space-x-2">
          {['24h', '7d', '30d'].map((period) => (
            <button
              key={period}
              onClick={() => setTimeframe(period)}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                timeframe === period
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* 关键指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Total Plays</p>
              <p className="text-2xl font-bold">{stats?.totalPlays?.toLocaleString()}</p>
            </div>
            <Play className="w-8 h-8 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-pink-500 to-pink-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-pink-100 text-sm">Unique Listeners</p>
              <p className="text-2xl font-bold">{stats?.uniqueListeners?.toLocaleString()}</p>
            </div>
            <Users className="w-8 h-8 text-pink-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Total Revenue</p>
              <p className="text-2xl font-bold">${stats?.totalRevenue?.toFixed(2)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Avg. Duration</p>
              <p className="text-2xl font-bold">{Math.floor(stats?.averagePlayDuration / 60)}:{(stats?.averagePlayDuration % 60).toString().padStart(2, '0')}</p>
            </div>
            <Clock className="w-8 h-8 text-orange-200" />
          </div>
        </div>
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* 播放趋势图 */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Plays & Revenue</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={stats?.dailyPlays}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar yAxisId="left" dataKey="plays" fill="#8B5CF6" />
              <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#EC4899" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 流派分布图 */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Genre Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={stats?.topGenres}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name} ${percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="plays"
              >
                {stats?.topGenres?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 热门音轨 */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Trending Tracks</h3>
        <div className="bg-gray-50 rounded-lg overflow-hidden">
          <div className="grid grid-cols-12 gap-4 p-4 bg-gray-100 text-sm font-medium text-gray-700">
            <div className="col-span-1">#</div>
            <div className="col-span-5">Track</div>
            <div className="col-span-2">Artist</div>
            <div className="col-span-2">Plays</div>
            <div className="col-span-2">Trend</div>
          </div>
          {trendingTracks.map((track, index) => (
            <div key={track.id} className="grid grid-cols-12 gap-4 p-4 border-b border-gray-200 hover:bg-white transition-colors">
              <div className="col-span-1 text-gray-500">{index + 1}</div>
              <div className="col-span-5">
                <div className="font-medium text-gray-900">{track.title}</div>
                <div className="text-sm text-gray-500">{track.genre}</div>
              </div>
              <div className="col-span-2 text-gray-700">{track.artist}</div>
              <div className="col-span-2 text-gray-700">{track.plays.toLocaleString()}</div>
              <div className="col-span-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {track.trend}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 收益详情 */}
      {earnings && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Award className="w-5 h-5 mr-2 text-blue-600" />
            Earnings Overview
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">${(earnings.totalEarnings || 0).toFixed(4)}</p>
              <p className="text-sm text-gray-600">Total Earnings</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">${(earnings.todayEarnings || 0).toFixed(4)}</p>
              <p className="text-sm text-gray-600">Today's Earnings</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{earnings.recentRecords?.length || 0}</p>
              <p className="text-sm text-gray-600">Recent Transactions</p>
            </div>
          </div>
          
          {earnings.recentRecords?.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Royalty Records</h4>
              <div className="space-y-2">
                {earnings.recentRecords.slice(0, 3).map((record, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-white rounded text-sm">
                    <span className="text-gray-600">{new Date(record.timestamp).toLocaleDateString()}</span>
                    <span className="font-medium text-green-600">+${record.royalties?.artist?.toFixed(4) || '0.0000'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 导出按钮 */}
      <div className="mt-6 flex justify-end">
        <button className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </button>
      </div>
    </div>
  );
};

export default AudioAnalytics;