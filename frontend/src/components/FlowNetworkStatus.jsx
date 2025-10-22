import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getFlowService } from '../services/flowService';
import { flowConfig } from '../config/environment';
import './FlowNetworkStatus.css';

const FlowNetworkStatus = () => {
  // 在本地开发模式下不显示网络状态组件
  if (flowConfig.localMode) {
    return null;
  }

  const { networkError } = useAuth();
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [blockHeight, setBlockHeight] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const checkConnection = async () => {
    try {
      console.log('🔍 FlowNetworkStatus: 开始检查连接...');
      setConnectionStatus('checking');
      const flowService = getFlowService();
      console.log('📦 FlowNetworkStatus: 获取FlowService实例成功');
      
      await flowService.init(); // 确保初始化
      console.log('✅ FlowNetworkStatus: FlowService初始化成功');
      
      await flowService.testConnection();
      console.log('✅ FlowNetworkStatus: 连接测试成功');
      
      setConnectionStatus('connected');
      setRetryCount(0);
      
      // 获取当前区块高度
      const height = await flowService.getCurrentBlockHeight();
      setBlockHeight(height);
      console.log('📊 FlowNetworkStatus: 当前区块高度:', height);
    } catch (error) {
      console.error('❌ FlowNetworkStatus: Flow网络连接检查失败:', error);
      console.error('❌ FlowNetworkStatus: 错误详情:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      setConnectionStatus('disconnected');
    }
  };

  const handleRetry = async () => {
    setRetryCount(prev => prev + 1);
    await checkConnection();
  };

  useEffect(() => {
    checkConnection();
    
    // 每30秒检查一次连接状态
    const interval = setInterval(checkConnection, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (!networkError && connectionStatus === 'connected') {
    return (
      <div className="flow-network-status connected">
        <div className="status-indicator">
          <span className="status-dot green"></span>
          <span className="status-text">Flow Network Connected</span>
          {blockHeight && (
            <span className="block-height">Block Height: {blockHeight}</span>
          )}
        </div>
      </div>
    );
  }

  if (networkError || connectionStatus === 'disconnected') {
    return (
      <div className="flow-network-status disconnected">
        <div className="status-indicator">
          <span className="status-dot red"></span>
          <span className="status-text">Flow Network Connection Failed</span>
        </div>
        <div className="error-details">
          <p className="error-message">
            {networkError?.message || 'Unable to connect to Flow blockchain network'}
          </p>
          <button 
            className="retry-button"
            onClick={handleRetry}
            disabled={connectionStatus === 'checking'}
          >
            {connectionStatus === 'checking' ? 'Retrying...' : `Retry (${retryCount})`}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flow-network-status checking">
      <div className="status-indicator">
        <span className="status-dot yellow"></span>
        <span className="status-text">检查Flow网络连接...</span>
      </div>
    </div>
  );
};

export default FlowNetworkStatus;