import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { AudioProvider } from './contexts/AudioContext'
import SecurityProvider from './components/SecurityProvider'
import Navbar from './components/Navbar'
import NetworkErrorBanner from './components/NetworkErrorBanner'
import FlowNetworkStatus from './components/FlowNetworkStatus'
import NetworkDiagnostic from './components/NetworkDiagnostic'
import FlowServiceComparison from './components/FlowServiceComparison'
import FlowServiceTester from './components/FlowServiceTester'
import QuickFlowTest from './components/QuickFlowTest'
import FlowServiceV3Tester from './components/FlowServiceV3Tester'
import GlobalAudioPlayer from './components/GlobalAudioPlayer'
import { ErrorBoundary } from './services/logger.jsx'
import logger from './services/logger.jsx'
import config from './config/environment'
import websocketService from './services/websocketService'
import Home from './pages/Home'
import Create from './pages/Create'
import CreateTest from './pages/CreateTest'
import Marketplace from './pages/Marketplace'
import Dashboard from './pages/Dashboard'
import Library from './pages/Library'
import MusicLibrary from './pages/MusicLibrary'
import Analytics from './pages/Analytics'
import Payment from './pages/Payment';
import AudioLibrary from './pages/AudioLibrary';
import UserProfile from './components/UserProfile';


import './index.css'

function App() {
  useEffect(() => {
    // 初始化应用服务
    const initializeApp = async () => {
      try {
        // 记录应用启动
        logger.info('FlowTune application starting', {
          environment: config.ENVIRONMENT,
          version: config.APP_VERSION || '1.0.0',
          timestamp: new Date().toISOString()
        })

        // 验证环境配置
        const configValid = config.validateConfig ? config.validateConfig() : true
        if (!configValid) {
          logger.warn('Environment configuration validation failed')
        }

        // 初始化性能监控
        if (config.ENVIRONMENT === 'production') {
          logger.info('Production mode: Performance monitoring enabled')
        }

        // 初始化WebSocket连接
        try {
          await websocketService.connect();
          websocketService.startHeartbeat();
          logger.info('WebSocket service initialized successfully');
        } catch (error) {
          logger.warn('Failed to initialize WebSocket service', error);
        }

        logger.info('Application initialized successfully')
      } catch (error) {
        logger.error('Failed to initialize application', error)
      }
    }

    initializeApp()

    // 清理函数
    return () => {
      websocketService.stopHeartbeat();
      websocketService.disconnect();
      logger.info('Application cleanup completed');
    };
  }, [])

  return (
    <SecurityProvider>
      <ErrorBoundary>
        <AuthProvider>
          <AudioProvider>
            <Router>
            <div className="min-h-screen bg-gray-50">
              <Navbar />
              <FlowNetworkStatus />
              <main>
                <div className="container mx-auto px-4">
                  <NetworkErrorBanner />
                </div>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/create" element={<Create />} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/library" element={<Library />} />
                <Route path="/music-library" element={<MusicLibrary />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/payment" element={<Payment />} />
                <Route path="/audio-library" element={<AudioLibrary />} />
                <Route path="/explore" element={<Marketplace />} />
                <Route path="/profile" element={<UserProfile />} />
                <Route path="/network-diagnostic" element={<NetworkDiagnostic />} />
            <Route path="/flow-service-comparison" element={<FlowServiceComparison />} />
            <Route path="/flow-service-tester" element={<FlowServiceTester />} />
            <Route path="/quick-flow-test" element={<QuickFlowTest />} />
                <Route path="/flow-service-v3-tester" element={<FlowServiceV3Tester />} />

               </Routes>
             </main>
             <GlobalAudioPlayer />
           </div>
           </Router>
        </AudioProvider>
      </AuthProvider>
      </ErrorBoundary>
    </SecurityProvider>
  )
}

export default App