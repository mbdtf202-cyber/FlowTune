/**
 * FlowService V3 测试器
 * 测试使用后端代理的Flow服务
 */

import React, { useState, useRef, useEffect } from 'react';
import flowServiceV3 from '../services/flowServiceV3.js';

const FlowServiceV3Tester = () => {
  const [logs, setLogs] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const logsEndRef = useRef(null);

  // 自动滚动到日志底部
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // 添加日志
  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { 
      id: Date.now(), 
      message, 
      type, 
      timestamp 
    }]);
  };

  // 清除日志
  const clearLogs = () => {
    setLogs([]);
  };

  // 测试基础连接
  const testBasicConnection = async () => {
    setIsRunning(true);
    addLog('🚀 开始测试FlowService V3基础连接...', 'info');

    try {
      const result = await flowServiceV3.testConnection();
      
      if (result.success) {
        addLog('✅ 基础连接测试成功!', 'success');
        addLog(`📡 代理状态: ${result.proxyStatus?.status || 'Unknown'}`, 'info');
        addLog(`🌐 链ID: ${result.networkParams?.chain_id || 'Unknown'}`, 'info');
        addLog(`📦 最新区块: ${result.latestBlock?.height || 'Unknown'}`, 'info');
      } else {
        addLog(`❌ 基础连接测试失败: ${result.error}`, 'error');
      }
    } catch (error) {
      addLog(`❌ 测试异常: ${error.message}`, 'error');
    }

    setIsRunning(false);
  };

  // 测试网络状态
  const testNetworkStatus = async () => {
    setIsRunning(true);
    addLog('🔍 测试网络状态...', 'info');

    try {
      const result = await flowServiceV3.getNetworkStatus();
      
      if (result.success) {
        addLog('✅ 网络状态获取成功!', 'success');
        addLog(`🔗 连接状态: ${result.isConnected ? '已连接' : '未连接'}`, result.isConnected ? 'success' : 'error');
        addLog(`🆔 链ID: ${result.chainId}`, 'info');
        addLog(`🖥️ 代理节点: ${result.proxyNode}`, 'info');
      } else {
        addLog(`❌ 网络状态获取失败: ${result.error}`, 'error');
      }
    } catch (error) {
      addLog(`❌ 测试异常: ${error.message}`, 'error');
    }

    setIsRunning(false);
  };

  // 测试区块高度
  const testBlockHeight = async () => {
    setIsRunning(true);
    addLog('📏 测试区块高度获取...', 'info');

    try {
      const result = await flowServiceV3.getCurrentBlockHeight();
      
      if (result.success) {
        addLog('✅ 区块高度获取成功!', 'success');
        addLog(`📊 当前高度: ${(result.height || 0).toLocaleString()}`, 'info');
        addLog(`🆔 区块ID: ${result.blockId || 'Unknown'}`, 'info');
      } else {
        addLog(`❌ 区块高度获取失败: ${result.error}`, 'error');
      }
    } catch (error) {
      addLog(`❌ 测试异常: ${error.message}`, 'error');
    }

    setIsRunning(false);
  };

  // 测试Flow代币供应量
  const testTokenSupply = async () => {
    setIsRunning(true);
    addLog('💰 测试Flow代币总供应量查询...', 'info');

    try {
      const result = await flowServiceV3.getFlowTokenSupply();
      
      if (result.success) {
        addLog('✅ Flow代币供应量查询成功!', 'success');
        addLog(`💎 总供应量: ${result.formatted}`, 'info');
      } else {
        addLog(`❌ Flow代币供应量查询失败: ${result.error}`, 'error');
      }
    } catch (error) {
      addLog(`❌ 测试异常: ${error.message}`, 'error');
    }

    setIsRunning(false);
  };

  // 综合健康检查
  const runHealthCheck = async () => {
    setIsRunning(true);
    addLog('🏥 开始综合健康检查...', 'info');

    try {
      const result = await flowServiceV3.healthCheck();
      
      if (result.success) {
        addLog('✅ 综合健康检查通过!', 'success');
        addLog(`📋 总结: ${result.summary}`, 'success');
        
        // 显示详细结果
        const { results } = result;
        addLog(`🔧 初始化状态: ${results?.initialization ? '✅' : '❌'}`, results?.initialization ? 'success' : 'error');
        addLog(`🔗 连接测试: ${results?.connection?.success ? '✅' : '❌'}`, results?.connection?.success ? 'success' : 'error');
        addLog(`🌐 网络状态: ${results?.networkStatus?.success ? '✅' : '❌'}`, results?.networkStatus?.success ? 'success' : 'error');
        addLog(`📊 区块高度: ${results?.blockHeight?.success ? '✅' : '❌'}`, results?.blockHeight?.success ? 'success' : 'error');
        addLog(`💰 代币查询: ${results?.tokenSupply?.success ? '✅' : '❌'}`, results?.tokenSupply?.success ? 'success' : 'error');
      } else {
        addLog(`❌ 综合健康检查失败: ${result.error}`, 'error');
      }
    } catch (error) {
      addLog(`❌ 测试异常: ${error.message}`, 'error');
    }

    setIsRunning(false);
  };

  // 获取日志样式
  const getLogStyle = (type) => {
    const baseStyle = 'px-3 py-1 rounded text-sm font-mono';
    switch (type) {
      case 'success':
        return `${baseStyle} bg-green-100 text-green-800 border-l-4 border-green-500`;
      case 'error':
        return `${baseStyle} bg-red-100 text-red-800 border-l-4 border-red-500`;
      case 'warning':
        return `${baseStyle} bg-yellow-100 text-yellow-800 border-l-4 border-yellow-500`;
      default:
        return `${baseStyle} bg-blue-100 text-blue-800 border-l-4 border-blue-500`;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          FlowService V3 测试器
        </h1>
        <p className="text-gray-600">
          测试使用后端代理的Flow区块链服务 - 彻底解决CORS问题
        </p>
      </div>

      {/* 测试按钮 */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={testBasicConnection}
          disabled={isRunning}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          🔗 基础连接测试
        </button>

        <button
          onClick={testNetworkStatus}
          disabled={isRunning}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          🌐 网络状态
        </button>

        <button
          onClick={testBlockHeight}
          disabled={isRunning}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          📊 区块高度
        </button>

        <button
          onClick={testTokenSupply}
          disabled={isRunning}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          💰 代币供应量
        </button>

        <button
          onClick={runHealthCheck}
          disabled={isRunning}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          🏥 综合检查
        </button>

        <button
          onClick={clearLogs}
          disabled={isRunning}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          🗑️ 清除日志
        </button>
      </div>

      {/* 运行状态指示器 */}
      {isRunning && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
            <span className="text-blue-700">测试运行中...</span>
          </div>
        </div>
      )}

      {/* 日志显示区域 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-gray-700">测试日志</h3>
          <span className="text-sm text-gray-500">
            共 {logs.length} 条日志
          </span>
        </div>
        
        <div className="bg-white rounded border max-h-96 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              暂无日志，点击上方按钮开始测试
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {logs.map((log) => (
                <div key={log.id} className={getLogStyle(log.type)}>
                  <div className="flex justify-between items-start">
                    <span className="flex-1">{log.message}</span>
                    <span className="text-xs opacity-70 ml-2">{log.timestamp}</span>
                  </div>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* 说明信息 */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-gray-700 mb-2">测试说明</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• <strong>基础连接测试</strong>: 测试后端代理的连通性和基本功能</li>
          <li>• <strong>网络状态</strong>: 检查Flow网络连接状态和链信息</li>
          <li>• <strong>区块高度</strong>: 获取当前最新区块高度</li>
          <li>• <strong>代币供应量</strong>: 执行Cadence脚本查询Flow代币总供应量</li>
          <li>• <strong>综合检查</strong>: 运行所有测试项目，提供完整的健康报告</li>
        </ul>
      </div>
    </div>
  );
};

export default FlowServiceV3Tester;