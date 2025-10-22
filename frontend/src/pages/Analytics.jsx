import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import EnhancedAnalytics from '../components/EnhancedAnalytics';
import { 
  BarChart3, TrendingUp, Activity, Zap, Brain, 
  Eye, Database, LineChart, PieChart, Settings,
  RefreshCw, Download, Filter, Search
} from 'lucide-react';

const Analytics = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeModule, setActiveModule] = useState('overview');

  // Set active module based on URL path
  useEffect(() => {
    const path = window.location.pathname;
    if (path.includes('/analytics/realtime')) {
      setActiveModule('realtime');
    } else if (path.includes('/analytics/visualization')) {
      setActiveModule('visualization');
    } else if (path.includes('/analytics/blockchain')) {
      setActiveModule('blockchain');
    } else if (path.includes('/analytics/ai-insights')) {
      setActiveModule('ai-insights');
    } else if (path.includes('/analytics/dune')) {
      setActiveModule('dune-integration');
    } else {
      setActiveModule('overview');
    }
  }, []);

  // Module configuration
  const analyticsModules = [
    {
      id: 'overview',
      title: 'Data Overview',
      description: 'Comprehensive data dashboard and key metrics',
      icon: BarChart3,
      color: 'blue',
      path: '/analytics/overview'
    },
    {
      id: 'realtime',
      title: 'Real-time Monitoring',
      description: 'Real-time data streams and monitoring panels',
      icon: Activity,
      color: 'green',
      path: '/analytics/realtime'
    },
    {
      id: 'visualization',
      title: 'Data Visualization',
      description: 'Interactive charts and data views',
      icon: LineChart,
      color: 'purple',
      path: '/analytics/visualization'
    },
    {
      id: 'blockchain',
      title: 'Blockchain Analytics',
      description: 'Flow blockchain data and transaction analysis',
      icon: Database,
      color: 'indigo',
      path: '/analytics/blockchain'
    },
    {
      id: 'ai-insights',
      title: 'AI Insights',
      description: 'Intelligent analysis and predictive recommendations',
      icon: Brain,
      color: 'orange',
      path: '/analytics/ai-insights'
    },
    {
      id: 'dune-integration',
      title: 'Dune Integration',
      description: 'External data sources and API integration',
      icon: Zap,
      color: 'yellow',
      path: '/analytics/dune'
    }
  ];

  const handleModuleClick = (module) => {
    setActiveModule(module.id);
    // Update URL to reflect current module
    if (module.path && module.id !== 'overview') {
      window.history.pushState({}, '', module.path);
    } else if (module.id === 'overview') {
      window.history.pushState({}, '', '/analytics');
    }
  };

  const renderModuleContent = () => {
    switch (activeModule) {
      case 'overview':
        return <EnhancedAnalytics />;
      case 'realtime':
        return <RealTimeMonitoring />;
      case 'visualization':
        return <DataVisualization />;
      case 'blockchain':
        return <BlockchainAnalytics />;
      case 'ai-insights':
        return <AIInsights />;
      case 'dune-integration':
        return <DuneIntegration />;
      default:
        return <EnhancedAnalytics />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">{t('analytics.title')}</h1>
            </div>
            <div className="flex items-center space-x-3">
              <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
          <p className="text-lg text-gray-600">
            {t('analytics.description')}
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {analyticsModules.map((module) => {
                const Icon = module.icon;
                const isActive = activeModule === module.id;
                return (
                  <button
                    key={module.id}
                    onClick={() => handleModuleClick(module)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                      isActive
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{module.title}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Module Grid - Only show when no specific module is selected */}
        {activeModule === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {analyticsModules.slice(1).map((module) => {
              const Icon = module.icon;
              return (
                <div
                  key={module.id}
                  onClick={() => handleModuleClick(module)}
                  className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div className={`p-2 rounded-lg bg-${module.color}-100`}>
                      <Icon className={`h-6 w-6 text-${module.color}-600`} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{module.title}</h3>
                  </div>
                  <p className="text-gray-600">{module.description}</p>
                  <div className="mt-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${module.color}-100 text-${module.color}-800`}>
                      Click to Enter
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Main Content Area */}
        <div className="bg-white rounded-lg shadow-sm">
          {renderModuleContent()}
        </div>
      </div>
    </div>
  );
};

// Real-time Monitoring Component
const RealTimeMonitoring = () => {
  const [realTimeData, setRealTimeData] = useState({
    activeUsers: 1234,
    activeTransactions: 567,
    newNFTs: 89,
    systemStatus: 'Normal',
    networkLatency: 45,
    throughput: 2.3,
    errorRate: 0.02
  });

  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [chartData, setChartData] = useState([]);

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeData(prev => ({
        activeUsers: prev.activeUsers + Math.floor(Math.random() * 20 - 10),
        activeTransactions: prev.activeTransactions + Math.floor(Math.random() * 10 - 5),
        newNFTs: prev.newNFTs + Math.floor(Math.random() * 3),
        systemStatus: Math.random() > 0.95 ? 'Warning' : 'Normal',
        networkLatency: 30 + Math.random() * 30,
        throughput: 2 + Math.random() * 2,
        errorRate: Math.random() * 0.05
      }));
      
      setLastUpdate(new Date());
      
      // Update chart data
      setChartData(prev => {
        const newData = [...prev, {
          time: new Date().toLocaleTimeString(),
          users: realTimeData.activeUsers,
          transactions: realTimeData.activeTransactions
        }];
        return newData.slice(-20); // Keep latest 20 data points
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [realTimeData.activeUsers, realTimeData.activeTransactions]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Normal': return 'text-green-600';
      case 'Warning': return 'text-yellow-600';
      case 'Error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getConnectionStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'disconnected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="p-6">
      {/* Header with connection status */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Activity className="h-6 w-6 text-green-600" />
          <h2 className="text-2xl font-bold text-gray-900">Real-time Monitoring</h2>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${getConnectionStatusColor(connectionStatus)}`}></div>
            <span className="text-sm text-gray-600">
              {connectionStatus === 'connected' ? 'Connected' : 'Connecting'}
            </span>
          </div>
          <div className="text-sm text-gray-500">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        </div>
      </div>
      
      {/* Real-time metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Active Users</p>
              <p className="text-2xl font-bold text-green-900">{realTimeData.activeUsers.toLocaleString()}</p>
              <p className="text-xs text-green-600 mt-1">+{Math.floor(Math.random() * 10)}% vs yesterday</p>
            </div>
            <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
              <Eye className="h-4 w-4 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Active Transactions</p>
              <p className="text-2xl font-bold text-blue-900">{realTimeData.activeTransactions.toLocaleString()}</p>
              <p className="text-xs text-blue-600 mt-1">TPS: {realTimeData.throughput.toFixed(1)}</p>
            </div>
            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">New NFTs</p>
              <p className="text-2xl font-bold text-purple-900">{realTimeData.newNFTs.toLocaleString()}</p>
              <p className="text-xs text-purple-600 mt-1">Today's total</p>
            </div>
            <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
              <Database className="h-4 w-4 text-purple-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">System Status</p>
              <p className={`text-2xl font-bold ${getStatusColor(realTimeData.systemStatus)}`}>
                {realTimeData.systemStatus}
              </p>
              <p className="text-xs text-orange-600 mt-1">Latency: {realTimeData.networkLatency.toFixed(0)}ms</p>
            </div>
            <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
              <Settings className="h-4 w-4 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Performance metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Network Performance</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm">
                <span>Network Latency</span>
                <span>{realTimeData.networkLatency.toFixed(0)}ms</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${Math.min(realTimeData.networkLatency / 100 * 100, 100)}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm">
                <span>Throughput</span>
                <span>{realTimeData.throughput.toFixed(1)} TPS</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${realTimeData.throughput / 5 * 100}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm">
                <span>Error Rate</span>
                <span>{(realTimeData.errorRate * 100).toFixed(2)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div 
                  className="bg-red-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${realTimeData.errorRate * 100 * 20}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Real-time Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-2 bg-green-50 rounded">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">New user registration: user_{Math.floor(Math.random() * 10000)}</span>
            </div>
            <div className="flex items-center space-x-3 p-2 bg-blue-50 rounded">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm">NFT transaction completed: #{Math.floor(Math.random() * 1000)}</span>
            </div>
            <div className="flex items-center space-x-3 p-2 bg-purple-50 rounded">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-sm">New NFT minted: FlowArt#{Math.floor(Math.random() * 10000)}</span>
            </div>
            <div className="flex items-center space-x-3 p-2 bg-yellow-50 rounded">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-sm">Smart contract call: {Math.floor(Math.random() * 100)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Alerts</h3>
          <div className="space-y-3">
            {realTimeData.systemStatus === 'Warning' ? (
              <div className="flex items-center space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-yellow-800">High Network Latency</p>
                  <p className="text-xs text-yellow-600">Current latency: {realTimeData.networkLatency.toFixed(0)}ms</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-green-800">System Running Normally</p>
                  <p className="text-xs text-green-600">All services operating normally</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Real-time chart */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Real-time Data Trends</h3>
        <div className="h-64 flex items-end space-x-1">
          {chartData.map((data, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div className="w-full flex flex-col justify-end h-48">
                <div 
                  className="bg-blue-500 rounded-t transition-all duration-300 mb-1"
                  style={{ height: `${(data.users / 1500) * 100}%` }}
                  title={`Users: ${data.users}`}
                ></div>
                <div 
                  className="bg-green-500 rounded-t transition-all duration-300"
                  style={{ height: `${(data.transactions / 700) * 100}%` }}
                  title={`Transactions: ${data.transactions}`}
                ></div>
              </div>
              <span className="text-xs text-gray-500 mt-1">{data.time.split(':').slice(1).join(':')}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center space-x-6 mt-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-sm text-gray-600">Active Users</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-sm text-gray-600">Active Transactions</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Data Visualization Component
const DataVisualization = () => {
  const [selectedChart, setSelectedChart] = useState('line');
  const [timeRange, setTimeRange] = useState('7d');
  const [dataFilter, setDataFilter] = useState('all');
  const [chartData, setChartData] = useState([]);

  // Generate mock data
  useEffect(() => {
    const generateData = () => {
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const data = [];
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (days - i));
        data.push({
          date: date.toLocaleDateString(),
          users: Math.floor(Math.random() * 1000) + 500,
          transactions: Math.floor(Math.random() * 500) + 200,
          volume: Math.floor(Math.random() * 10000) + 5000,
          nfts: Math.floor(Math.random() * 100) + 50
        });
      }
      setChartData(data);
    };
    generateData();
  }, [timeRange]);

  const chartTypes = [
    { id: 'line', name: 'Line Chart', icon: LineChart },
    { id: 'bar', name: 'Bar Chart', icon: BarChart3 },
    { id: 'pie', name: 'Pie Chart', icon: PieChart }
  ];

  const timeRanges = [
    { id: '7d', name: '7 Days' },
    { id: '30d', name: '30 Days' },
    { id: '90d', name: '90 Days' }
  ];

  const dataFilters = [
    { id: 'all', name: 'All Data' },
    { id: 'users', name: 'User Data' },
    { id: 'transactions', name: 'Transaction Data' },
    { id: 'nfts', name: 'NFT Data' }
  ];

  const renderLineChart = () => (
    <div className="h-80 flex items-end space-x-2 p-4">
      {chartData.map((data, index) => (
        <div key={index} className="flex-1 flex flex-col items-center">
          <div className="w-full flex flex-col justify-end h-64">
            <div 
              className="bg-blue-500 rounded-t transition-all duration-300 mb-1"
              style={{ height: `${(data.users / 1500) * 100}%` }}
              title={`Users: ${data.users}`}
            ></div>
            <div 
              className="bg-green-500 rounded-t transition-all duration-300 mb-1"
              style={{ height: `${(data.transactions / 700) * 100}%` }}
              title={`Transactions: ${data.transactions}`}
            ></div>
            <div 
              className="bg-purple-500 rounded-t transition-all duration-300"
              style={{ height: `${(data.nfts / 150) * 100}%` }}
              title={`NFTs: ${data.nfts}`}
            ></div>
          </div>
          <span className="text-xs text-gray-500 mt-2">{data.date.split('/').slice(1).join('/')}</span>
        </div>
      ))}
    </div>
  );

  const renderBarChart = () => (
    <div className="h-80 flex items-end space-x-3 p-4">
      {chartData.slice(-7).map((data, index) => (
        <div key={index} className="flex-1 flex flex-col items-center">
          <div className="w-full flex justify-center items-end h-64">
            <div 
              className="bg-gradient-to-t from-blue-600 to-blue-400 rounded-t w-full transition-all duration-500"
              style={{ height: `${(data.volume / 15000) * 100}%` }}
              title={`Volume: ${data.volume}`}
            ></div>
          </div>
          <span className="text-xs text-gray-500 mt-2">{data.date.split('/').slice(1).join('/')}</span>
        </div>
      ))}
    </div>
  );

  const renderPieChart = () => {
    const totalUsers = chartData.reduce((sum, data) => sum + data.users, 0);
    const totalTransactions = chartData.reduce((sum, data) => sum + data.transactions, 0);
    const totalNFTs = chartData.reduce((sum, data) => sum + data.nfts, 0);
    const total = totalUsers + totalTransactions + totalNFTs;

    const segments = [
      { name: 'User Activity', value: totalUsers, color: 'text-blue-600', bg: 'bg-blue-500' },
      { name: 'Transaction Activity', value: totalTransactions, color: 'text-green-600', bg: 'bg-green-500' },
      { name: 'NFT Activity', value: totalNFTs, color: 'text-purple-600', bg: 'bg-purple-500' }
    ];

    return (
      <div className="h-80 flex items-center justify-center p-4">
        <div className="flex items-center space-x-8">
          <div className="relative w-48 h-48">
            <div className="w-full h-full rounded-full bg-gradient-to-r from-blue-500 via-green-500 to-purple-500"></div>
            <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{total.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Total Activity</div>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            {segments.map((segment, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded ${segment.bg}`}></div>
                <div>
                  <div className="font-medium text-gray-900">{segment.name}</div>
                  <div className={`text-sm ${segment.color}`}>
                    {segment.value.toLocaleString()} ({((segment.value / total) * 100).toFixed(1)}%)
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderChart = () => {
    switch (selectedChart) {
      case 'line': return renderLineChart();
      case 'bar': return renderBarChart();
      case 'pie': return renderPieChart();
      default: return renderLineChart();
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <LineChart className="h-6 w-6 text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-900">Data Visualization</h2>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download className="h-4 w-4" />
            <span>Export Chart</span>
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Chart Type</h3>
          <div className="space-y-2">
            {chartTypes.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  onClick={() => setSelectedChart(type.id)}
                  className={`w-full flex items-center space-x-3 p-2 rounded-lg transition-colors ${
                    selectedChart === type.id
                      ? 'bg-purple-100 text-purple-700 border border-purple-200'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm">{type.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Time Range</h3>
          <div className="space-y-2">
            {timeRanges.map((range) => (
              <button
                key={range.id}
                onClick={() => setTimeRange(range.id)}
                className={`w-full text-left p-2 rounded-lg transition-colors ${
                  timeRange === range.id
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <span className="text-sm">{range.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Data Filter</h3>
          <div className="space-y-2">
            {dataFilters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setDataFilter(filter.id)}
                className={`w-full text-left p-2 rounded-lg transition-colors ${
                  dataFilter === filter.id
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <span className="text-sm">{filter.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart Display */}
      <div className="bg-white rounded-lg border shadow-sm mb-8">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              {chartTypes.find(t => t.id === selectedChart)?.name} - {timeRanges.find(r => r.id === timeRange)?.name}
            </h3>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span className="text-sm text-gray-600">Users</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span className="text-sm text-gray-600">Transactions</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-purple-500 rounded"></div>
                <span className="text-sm text-gray-600">NFTs</span>
              </div>
            </div>
          </div>
        </div>
        <div className="p-6">
          {renderChart()}
        </div>
      </div>

      {/* Data Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Average Users</p>
              <p className="text-2xl font-bold text-blue-900">
                {chartData.length > 0 ? Math.floor(chartData.reduce((sum, d) => sum + d.users, 0) / chartData.length).toLocaleString() : 0}
              </p>
            </div>
            <Eye className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Average Transactions</p>
              <p className="text-2xl font-bold text-green-900">
                {chartData.length > 0 ? Math.floor(chartData.reduce((sum, d) => sum + d.transactions, 0) / chartData.length).toLocaleString() : 0}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Average NFTs</p>
              <p className="text-2xl font-bold text-purple-900">
                {chartData.length > 0 ? Math.floor(chartData.reduce((sum, d) => sum + d.nfts, 0) / chartData.length).toLocaleString() : 0}
              </p>
            </div>
            <Database className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">Total Volume</p>
              <p className="text-2xl font-bold text-orange-900">
                {chartData.length > 0 ? Math.floor(chartData.reduce((sum, d) => sum + d.volume, 0) / 1000).toLocaleString() + 'K' : 0}
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>
    </div>
  );
};

// Blockchain Analytics Component
const BlockchainAnalytics = () => {
  const [selectedNetwork, setSelectedNetwork] = useState('flow-mainnet');
  const [timeRange, setTimeRange] = useState('24h');
  const [blockchainData, setBlockchainData] = useState({
    totalTransactions: 0,
    totalBlocks: 0,
    totalAccounts: 0,
    avgBlockTime: 0,
    networkHashRate: 0,
    gasUsage: 0
  });

  useEffect(() => {
    // Simulate blockchain data fetching
    const fetchBlockchainData = () => {
      setBlockchainData({
        totalTransactions: Math.floor(Math.random() * 1000000) + 500000,
        totalBlocks: Math.floor(Math.random() * 100000) + 50000,
        totalAccounts: Math.floor(Math.random() * 50000) + 25000,
        avgBlockTime: (Math.random() * 3 + 1).toFixed(2),
        networkHashRate: (Math.random() * 100 + 50).toFixed(2),
        gasUsage: (Math.random() * 80 + 20).toFixed(1)
      });
    };

    fetchBlockchainData();
    const interval = setInterval(fetchBlockchainData, 30000);
    return () => clearInterval(interval);
  }, [selectedNetwork, timeRange]);

  const networkOptions = [
    { value: 'flow-mainnet', label: 'Flow Mainnet' },
    { value: 'flow-testnet', label: 'Flow Testnet' },
    { value: 'flow-emulator', label: 'Flow Emulator' }
  ];

  const timeRangeOptions = [
    { value: '1h', label: '1 Hour' },
    { value: '24h', label: '24 Hours' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' }
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Database className="h-6 w-6 text-indigo-600" />
          <h2 className="text-2xl font-bold text-gray-900">Blockchain Analytics</h2>
        </div>
        <div className="flex space-x-4">
          <select
            value={selectedNetwork}
            onChange={(e) => setSelectedNetwork(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {networkOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {timeRangeOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Network Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Total Transactions</p>
              <p className="text-2xl font-bold">{blockchainData.totalTransactions.toLocaleString()}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Total Blocks</p>
              <p className="text-2xl font-bold">{blockchainData.totalBlocks.toLocaleString()}</p>
            </div>
            <Database className="h-8 w-8 text-green-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Total Accounts</p>
              <p className="text-2xl font-bold">{blockchainData.totalAccounts.toLocaleString()}</p>
            </div>
            <Eye className="h-8 w-8 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Network Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Network Performance</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Average Block Time</span>
              <span className="font-semibold">{blockchainData.avgBlockTime}s</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Network Hash Rate</span>
              <span className="font-semibold">{blockchainData.networkHashRate} TH/s</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Gas Usage</span>
              <div className="flex items-center space-x-2">
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-indigo-600 h-2 rounded-full" 
                    style={{ width: `${blockchainData.gasUsage}%` }}
                  ></div>
                </div>
                <span className="font-semibold">{blockchainData.gasUsage}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Analysis</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Success Rate</span>
              <span className="font-semibold text-green-600">98.5%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Average Gas Fee</span>
              <span className="font-semibold">0.00001 FLOW</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">TPS (Transactions Per Second)</span>
              <span className="font-semibold">1,247</span>
            </div>
          </div>
        </div>
      </div>

      {/* Latest Block Information */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Latest Blocks</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Block Height</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hash</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transactions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[...Array(5)].map((_, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {blockchainData.totalBlocks - index}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                    0x{Math.random().toString(16).substr(2, 8)}...
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {Math.floor(Math.random() * 100) + 10}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {index === 0 ? 'Just now' : `${index + 1} minutes ago`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// AI Insights Component
const AIInsights = () => {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    // Simulate AI insights data fetching
    const fetchInsights = () => {
      setLoading(true);
      setTimeout(() => {
        const mockInsights = [
          {
            id: 1,
            category: 'trend',
            title: 'Transaction Volume Trend Prediction',
            description: 'Based on historical data analysis, transaction volume is expected to grow by 15% in the next 7 days',
            confidence: 85,
            impact: 'high',
            recommendation: 'Recommend increasing liquidity pools to handle transaction volume growth',
            timestamp: new Date().toISOString()
          },
          {
            id: 2,
            category: 'risk',
            title: 'Anomalous Transaction Detection',
            description: 'Detected 3 possible anomalous transaction patterns, recommend further investigation',
            confidence: 92,
            impact: 'medium',
            recommendation: 'Enable advanced monitoring mode and set up automatic alerts',
            timestamp: new Date(Date.now() - 3600000).toISOString()
          },
          {
            id: 3,
            category: 'optimization',
            title: 'Gas Fee Optimization Recommendation',
            description: 'Current gas fees can be reduced by 12% through smart routing optimization',
            confidence: 78,
            impact: 'medium',
            recommendation: 'Implement smart gas fee scheduling algorithm',
            timestamp: new Date(Date.now() - 7200000).toISOString()
          },
          {
            id: 4,
            category: 'market',
            title: 'Market Sentiment Analysis',
            description: 'Social media sentiment indicators show positive trends, expecting price increases',
            confidence: 73,
            impact: 'high',
            recommendation: 'Consider increasing marketing activities to leverage positive sentiment',
            timestamp: new Date(Date.now() - 10800000).toISOString()
          }
        ];
        setInsights(mockInsights);
        setLoading(false);
      }, 1000);
    };

    fetchInsights();
  }, [selectedCategory]);

  const categories = [
    { value: 'all', label: 'All Insights' },
    { value: 'trend', label: 'Trend Analysis' },
    { value: 'risk', label: 'Risk Assessment' },
    { value: 'optimization', label: 'Optimization Recommendations' },
    { value: 'market', label: 'Market Analysis' }
  ];

  const getImpactColor = (impact) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'trend': return <TrendingUp className="h-5 w-5" />;
      case 'risk': return <Activity className="h-5 w-5" />;
      case 'optimization': return <Settings className="h-5 w-5" />;
      case 'market': return <BarChart3 className="h-5 w-5" />;
      default: return <Brain className="h-5 w-5" />;
    }
  };

  const filteredInsights = selectedCategory === 'all' 
    ? insights 
    : insights.filter(insight => insight.category === selectedCategory);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Brain className="h-6 w-6 text-orange-600" />
          <h2 className="text-2xl font-bold text-gray-900">AI Insights</h2>
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          {categories.map(category => (
            <option key={category.value} value={category.value}>{category.label}</option>
          ))}
        </select>
      </div>

      {/* AI Insights Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100">Total Insights</p>
              <p className="text-2xl font-bold">{insights.length}</p>
            </div>
            <Brain className="h-8 w-8 text-orange-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100">High Impact Insights</p>
              <p className="text-2xl font-bold">{insights.filter(i => i.impact === 'high').length}</p>
            </div>
            <Activity className="h-8 w-8 text-red-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Average Confidence</p>
              <p className="text-2xl font-bold">
                {insights.length > 0 ? Math.round(insights.reduce((acc, i) => acc + i.confidence, 0) / insights.length) : 0}%
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Processed Recommendations</p>
              <p className="text-2xl font-bold">12</p>
            </div>
            <Settings className="h-8 w-8 text-green-200" />
          </div>
        </div>
      </div>

      {/* Insights List */}
      <div className="space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 text-orange-600 animate-spin" />
            <span className="ml-2 text-gray-600">AI is analyzing data...</span>
          </div>
        ) : (
          filteredInsights.map((insight) => (
            <div key={insight.id} className="bg-white p-6 rounded-lg border hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
                    {getCategoryIcon(insight.category)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{insight.title}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(insight.timestamp).toLocaleString('en-US')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getImpactColor(insight.impact)}`}>
                    {insight.impact === 'high' ? 'High Impact' : insight.impact === 'medium' ? 'Medium Impact' : 'Low Impact'}
                  </span>
                  <div className="flex items-center space-x-1">
                    <span className="text-sm text-gray-600">Confidence:</span>
                    <span className="text-sm font-semibold text-orange-600">{insight.confidence}%</span>
                  </div>
                </div>
              </div>
              
              <p className="text-gray-700 mb-4">{insight.description}</p>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">AI Recommendation:</h4>
                <p className="text-sm text-gray-700">{insight.recommendation}</p>
              </div>
              
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-orange-600 h-2 rounded-full" 
                      style={{ width: `${insight.confidence}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500">Confidence</span>
                </div>
                <div className="flex space-x-2">
                  <button className="px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200 transition-colors">
                    Accept
                  </button>
                  <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors">
                    Ignore
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Dune Integration Component
const DuneIntegration = () => {
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [queries, setQueries] = useState([]);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Simulate Dune query data fetching
    const mockQueries = [
      {
        id: 1,
        name: 'Flow Daily Transactions',
        description: 'Flow blockchain daily transaction statistics',
        author: 'FlowTune Team',
        lastRun: new Date(Date.now() - 3600000).toISOString(),
        status: 'success',
        executionTime: '2.3s',
        rows: 1247
      },
      {
        id: 2,
        name: 'NFT Market Analysis',
        description: 'Flow NFT market transaction analysis',
        author: 'Community',
        lastRun: new Date(Date.now() - 7200000).toISOString(),
        status: 'success',
        executionTime: '4.1s',
        rows: 892
      },
      {
        id: 3,
        name: 'DeFi Protocol TVL',
        description: 'Flow DeFi protocol total value locked',
        author: 'DeFi Analytics',
        lastRun: new Date(Date.now() - 10800000).toISOString(),
        status: 'running',
        executionTime: '-',
        rows: 0
      },
      {
        id: 4,
        name: 'Token Distribution',
        description: 'FLOW token distribution analysis',
        author: 'FlowTune Team',
        lastRun: new Date(Date.now() - 14400000).toISOString(),
        status: 'failed',
        executionTime: '1.2s',
        rows: 0
      }
    ];
    setQueries(mockQueries);
  }, []);

  const handleRunQuery = (queryId) => {
    setLoading(true);
    setSelectedQuery(queryId);
    
    // Simulate query execution
    setTimeout(() => {
      setQueries(prev => prev.map(q => 
        q.id === queryId 
          ? { ...q, status: 'success', lastRun: new Date().toISOString(), executionTime: `${(Math.random() * 5 + 1).toFixed(1)}s`, rows: Math.floor(Math.random() * 2000) + 100 }
          : q
      ));
      setLoading(false);
      setSelectedQuery(null);
    }, 2000);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-100';
      case 'running': return 'text-blue-600 bg-blue-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'success': return 'Success';
      case 'running': return 'Running';
      case 'failed': return 'Failed';
      default: return 'Unknown';
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Zap className="h-6 w-6 text-yellow-600" />
          <h2 className="text-2xl font-bold text-gray-900">Dune Integration</h2>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
            connectionStatus === 'connected' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span>{connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
      </div>

      {/* Connection Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100">Active Queries</p>
              <p className="text-2xl font-bold">{queries.filter(q => q.status === 'success').length}</p>
            </div>
            <Zap className="h-8 w-8 text-yellow-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Total Data Rows</p>
              <p className="text-2xl font-bold">{queries.reduce((acc, q) => acc + q.rows, 0).toLocaleString()}</p>
            </div>
            <Database className="h-8 w-8 text-blue-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Success Rate</p>
              <p className="text-2xl font-bold">
                {queries.length > 0 ? Math.round((queries.filter(q => q.status === 'success').length / queries.length) * 100) : 0}%
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Average Execution Time</p>
              <p className="text-2xl font-bold">2.4s</p>
            </div>
            <Activity className="h-8 w-8 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Query Management */}
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Dune Queries</h3>
            <button className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors">
              New Query
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            {queries.map((query) => (
              <div key={query.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-yellow-100 text-yellow-600">
                      <BarChart3 className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">{query.name}</h4>
                      <p className="text-sm text-gray-500">by {query.author}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(query.status)}`}>
                      {getStatusText(query.status)}
                    </span>
                    <button
                      onClick={() => handleRunQuery(query.id)}
                      disabled={loading && selectedQuery === query.id}
                      className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 transition-colors disabled:opacity-50"
                    >
                      {loading && selectedQuery === query.id ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        'Run'
                      )}
                    </button>
                  </div>
                </div>
                
                <p className="text-gray-700 mb-3">{query.description}</p>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Last Run:</span>
                    <p className="font-medium">{new Date(query.lastRun).toLocaleString('en-US')}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Execution Time:</span>
                    <p className="font-medium">{query.executionTime}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Rows Returned:</span>
                    <p className="font-medium">{query.rows.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* API Configuration */}
      <div className="mt-8 bg-white rounded-lg border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">API Configuration</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
              <div className="flex space-x-2">
                <input
                  type="password"
                  value="dune_api_key_****"
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                />
                <button className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors">
                  Update
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rate Limit</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500">
                <option>10 requests per minute</option>
                <option>20 requests per minute</option>
                <option>50 requests per minute</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;