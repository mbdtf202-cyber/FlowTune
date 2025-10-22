import React, { useState } from 'react';
import { flowConfig } from '../config/environment';

const FlowServiceComparison = () => {
  // 在本地开发模式下显示不同的界面
  if (flowConfig.localMode) {
    return (
      <div className="flow-service-comparison">
        <div className="test-header">
          <h2>🏠 本地开发模式</h2>
          <p>Flow服务比较功能在本地模式下不可用。</p>
        </div>
        <div className="local-mode-info">
          <div className="info-card">
            <h3>ℹ️ 说明</h3>
            <p>此功能需要连接到Flow网络进行测试，在本地开发模式下已禁用。</p>
            <p>如需测试Flow服务，请在 <code>.env</code> 文件中禁用本地模式。</p>
          </div>
        </div>
      </div>
    );
  }

  const [results, setResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (message, type = 'info', service = 'general') => {
    const timestamp = new Date().toLocaleTimeString();
    setResults(prev => [...prev, { message, type, timestamp, service }]);
  };

  const clearResults = () => {
    setResults([]);
  };

  // 测试原版FlowService
  const testOriginalFlowService = async () => {
    addResult('🔍 测试原版FlowService...', 'info', 'v1');
    try {
      const { default: flowService } = await import('../services/flowService');
      
      addResult('📦 原版FlowService加载成功', 'success', 'v1');
      
      // 测试初始化
      await flowService.init();
      addResult('⚙️ 原版FlowService初始化完成', 'success', 'v1');
      
      // 测试连接
      const result = await flowService.testConnection();
      addResult(`✅ 原版连接测试成功`, 'success', 'v1');
      
    } catch (error) {
      addResult(`❌ 原版FlowService测试失败: ${error.message}`, 'error', 'v1');
      addResult(`🔍 错误详情: ${error.stack?.substring(0, 200)}...`, 'error', 'v1');
    }
  };

  // 测试新版FlowService
  const testNewFlowService = async () => {
    addResult('🔍 测试新版FlowService V2...', 'info', 'v2');
    try {
      const { default: flowServiceV2 } = await import('../services/flowServiceV2');
      
      addResult('📦 新版FlowService V2加载成功', 'success', 'v2');
      
      // 测试初始化
      await flowServiceV2.init();
      addResult('⚙️ 新版FlowService V2初始化完成', 'success', 'v2');
      
      // 测试连接
      const result = await flowServiceV2.testConnection();
      addResult(`✅ 新版连接测试成功: chain_id = ${result.chainId}`, 'success', 'v2');
      
      // 获取网络状态
      const status = flowServiceV2.getNetworkStatus();
      addResult(`📊 网络状态: 节点 ${status.nodeIndex + 1}/${status.totalNodes}`, 'info', 'v2');
      addResult(`🌐 当前节点: ${status.currentNode}`, 'info', 'v2');
      
    } catch (error) {
      addResult(`❌ 新版FlowService V2测试失败: ${error.message}`, 'error', 'v2');
      addResult(`🔍 错误详情: ${error.stack?.substring(0, 200)}...`, 'error', 'v2');
    }
  };

  // 运行比较测试
  const runComparisonTest = async () => {
    setIsRunning(true);
    clearResults();
    
    addResult('🚀 开始FlowService比较测试...', 'info', 'general');
    
    // 测试原版
    await testOriginalFlowService();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 测试新版
    await testNewFlowService();
    
    addResult('🏁 比较测试完成', 'info', 'general');
    setIsRunning(false);
  };

  const getResultColor = (type) => {
    switch (type) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      default: return 'text-blue-600';
    }
  };

  const getServiceBadge = (service) => {
    switch (service) {
      case 'v1': return <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">V1</span>;
      case 'v2': return <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">V2</span>;
      default: return <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">通用</span>;
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">FlowService 版本比较测试</h2>
        
        <div className="mb-4 space-x-2">
          <button
            onClick={runComparisonTest}
            disabled={isRunning}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded"
          >
            {isRunning ? '测试中...' : '运行比较测试'}
          </button>
          
          <button
            onClick={clearResults}
            disabled={isRunning}
            className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white px-4 py-2 rounded"
          >
            清除结果
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 原版FlowService结果 */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2 text-blue-800">原版 FlowService</h3>
            <div className="bg-white rounded p-3 h-64 overflow-y-auto">
              {results.filter(r => r.service === 'v1').length === 0 ? (
                <p className="text-gray-500 text-sm">等待测试结果...</p>
              ) : (
                <div className="space-y-1">
                  {results.filter(r => r.service === 'v1').map((result, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <span className="text-xs text-gray-400 min-w-[60px]">
                        {result.timestamp}
                      </span>
                      <span className={`text-sm ${getResultColor(result.type)}`}>
                        {result.message}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 新版FlowService结果 */}
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2 text-green-800">新版 FlowService V2</h3>
            <div className="bg-white rounded p-3 h-64 overflow-y-auto">
              {results.filter(r => r.service === 'v2').length === 0 ? (
                <p className="text-gray-500 text-sm">等待测试结果...</p>
              ) : (
                <div className="space-y-1">
                  {results.filter(r => r.service === 'v2').map((result, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <span className="text-xs text-gray-400 min-w-[60px]">
                        {result.timestamp}
                      </span>
                      <span className={`text-sm ${getResultColor(result.type)}`}>
                        {result.message}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 通用结果 */}
        <div className="mt-4 bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2 text-gray-800">测试日志</h3>
          <div className="bg-white rounded p-3 h-32 overflow-y-auto">
            {results.filter(r => r.service === 'general').length === 0 ? (
              <p className="text-gray-500 text-sm">点击"运行比较测试"开始...</p>
            ) : (
              <div className="space-y-1">
                {results.filter(r => r.service === 'general').map((result, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <span className="text-xs text-gray-400 min-w-[60px]">
                      {result.timestamp}
                    </span>
                    <span className={`text-sm ${getResultColor(result.type)}`}>
                      {result.message}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 功能对比表 */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">功能对比</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">功能</th>
                  <th className="px-4 py-2 text-center text-sm font-medium text-gray-700">原版 V1</th>
                  <th className="px-4 py-2 text-center text-sm font-medium text-gray-700">新版 V2</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-4 py-2 text-sm text-gray-900">网络重试机制</td>
                  <td className="px-4 py-2 text-center text-sm">❌</td>
                  <td className="px-4 py-2 text-center text-sm">✅</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-sm text-gray-900">备用访问节点</td>
                  <td className="px-4 py-2 text-center text-sm">❌</td>
                  <td className="px-4 py-2 text-center text-sm">✅</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-sm text-gray-900">故障转移</td>
                  <td className="px-4 py-2 text-center text-sm">❌</td>
                  <td className="px-4 py-2 text-center text-sm">✅</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-sm text-gray-900">详细错误日志</td>
                  <td className="px-4 py-2 text-center text-sm">⚠️</td>
                  <td className="px-4 py-2 text-center text-sm">✅</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-sm text-gray-900">网络状态监控</td>
                  <td className="px-4 py-2 text-center text-sm">❌</td>
                  <td className="px-4 py-2 text-center text-sm">✅</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-sm text-gray-900">超时控制</td>
                  <td className="px-4 py-2 text-center text-sm">⚠️</td>
                  <td className="px-4 py-2 text-center text-sm">✅</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlowServiceComparison;