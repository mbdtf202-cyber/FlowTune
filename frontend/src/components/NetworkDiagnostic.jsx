import React, { useState } from 'react';

const NetworkDiagnostic = () => {
  const [results, setResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setResults(prev => [...prev, { message, type, timestamp }]);
  };

  const clearResults = () => {
    setResults([]);
  };

  // 基础网络测试
  const testBasicFetch = async () => {
    addResult('🔍 测试基础fetch功能...');
    try {
      const response = await window.fetch('https://httpbin.org/json');
      const data = await response.json();
      addResult(`✅ 基础fetch测试成功: ${JSON.stringify(data).substring(0, 50)}...`, 'success');
    } catch (error) {
      addResult(`❌ 基础fetch测试失败: ${error.message}`, 'error');
    }
  };

  // 测试Flow REST API - 原生fetch
  const testFlowNativeFetch = async () => {
    addResult('🌊 测试Flow REST API (原生fetch)...');
    try {
      const response = await window.fetch('https://rest-testnet.onflow.org/v1/network/parameters', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      addResult(`📊 响应状态: ${response.status} ${response.statusText}`, 'info');
      addResult(`🔗 响应URL: ${response.url}`, 'info');
      
      if (response.ok) {
        const data = await response.json();
        addResult(`✅ Flow API测试成功: chain_id = ${data.chain_id}`, 'success');
      } else {
        addResult(`⚠️ Flow API响应异常: ${response.status}`, 'warning');
      }
    } catch (error) {
      addResult(`❌ Flow API测试失败: ${error.message}`, 'error');
      addResult(`🔍 错误详情: ${error.stack}`, 'error');
    }
  };

  // 测试Flow REST API - window.fetch
  const testFlowWindowFetch = async () => {
    addResult('🌊 测试Flow REST API (window.fetch)...');
    try {
      const response = await window.fetch('https://rest-testnet.onflow.org/v1/network/parameters', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      addResult(`📊 响应状态: ${response.status} ${response.statusText}`, 'info');
      
      if (response.ok) {
        const data = await response.json();
        addResult(`✅ Flow API (window.fetch)测试成功: chain_id = ${data.chain_id}`, 'success');
      } else {
        addResult(`⚠️ Flow API (window.fetch)响应异常: ${response.status}`, 'warning');
      }
    } catch (error) {
      addResult(`❌ Flow API (window.fetch)测试失败: ${error.message}`, 'error');
    }
  };

  // 测试Flow访问节点
  const testProxyPath = async () => {
    addResult('🔄 测试Flow访问节点...');
    try {
      const response = await window.fetch('https://rest-testnet.onflow.org/v1/network/parameters', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      addResult(`📊 Flow访问节点响应状态: ${response.status} ${response.statusText}`, 'info');
      
      if (response.ok) {
        const data = await response.json();
        addResult(`✅ Flow访问节点测试成功: chain_id = ${data.chain_id}`, 'success');
      } else {
        addResult(`⚠️ Flow访问节点响应异常: ${response.status}`, 'warning');
      }
    } catch (error) {
      addResult(`❌ 代理路径测试失败: ${error.message}`, 'error');
    }
  };

  // 测试FCL基础功能
  const testFCLBasic = async () => {
    addResult('🔧 测试FCL基础功能...');
    try {
      // 动态导入FCL
      const { default: fcl } = await import('@onflow/fcl');
      
      addResult('📦 FCL模块加载成功', 'success');
      
      // 配置FCL
      fcl.config({
        'flow.network': 'testnet',
        'accessNode.api': 'https://access-testnet.onflow.org',
        'discovery.wallet': 'https://fcl-discovery.onflow.org/testnet/authn'
      });
      
      addResult('⚙️ FCL配置完成', 'success');
      
      // 测试简单查询
      const result = await fcl.query({
        cadence: `
          access(all) fun main(): String {
            return "Hello from Flow!"
          }
        `
      });
      
      addResult(`✅ FCL查询测试成功: ${result}`, 'success');
      
    } catch (error) {
      addResult(`❌ FCL测试失败: ${error.message}`, 'error');
      addResult(`🔍 FCL错误详情: ${error.stack}`, 'error');
    }
  };

  // 运行所有测试
  const runAllTests = async () => {
    setIsRunning(true);
    clearResults();
    
    addResult('🚀 开始网络诊断测试...', 'info');
    
    await testBasicFetch();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testFlowNativeFetch();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testFlowWindowFetch();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testProxyPath();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testFCLBasic();
    
    addResult('🏁 所有测试完成', 'info');
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

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">网络连接诊断工具</h2>
        
        <div className="mb-4 space-x-2">
          <button
            onClick={runAllTests}
            disabled={isRunning}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded"
          >
            {isRunning ? '测试中...' : '运行所有测试'}
          </button>
          
          <button
            onClick={clearResults}
            disabled={isRunning}
            className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white px-4 py-2 rounded"
          >
            清除结果
          </button>
        </div>

        <div className="bg-gray-100 rounded-lg p-4 h-96 overflow-y-auto">
          {results.length === 0 ? (
            <p className="text-gray-500">点击"运行所有测试"开始诊断...</p>
          ) : (
            <div className="space-y-2">
              {results.map((result, index) => (
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
  );
};

export default NetworkDiagnostic;