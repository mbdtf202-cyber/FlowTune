import React, { useState } from 'react';
import * as fcl from '@onflow/fcl';
import { flowConfig } from '../config/environment';

const QuickFlowTest = () => {
  const [results, setResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  // 在本地开发模式下显示不同的界面
  if (flowConfig.localMode) {
    return (
      <div className="quick-flow-test">
        <div className="test-header">
          <h2>🏠 Local Development Mode</h2>
          <p>Flow network connection is disabled, application running in local mode.</p>
        </div>
        <div className="local-mode-info">
          <div className="info-card">
            <h3>✅ Local Mode Advantages</h3>
            <ul>
              <li>No network connection required</li>
              <li>Faster development experience</li>
              <li>Avoid network error interference</li>
              <li>Focus on UI and functionality development</li>
            </ul>
          </div>
          <div className="info-card">
            <h3>⚙️ How to Enable Network Mode</h3>
            <p>Set in <code>.env</code> file:</p>
            <pre>
              VITE_LOCAL_DEV_MODE=false<br/>
              VITE_DISABLE_FLOW_NETWORK=false
            </pre>
          </div>
        </div>
      </div>
    );
  }

  const addResult = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setResults(prev => [...prev, { message, type, timestamp }]);
  };

  const clearResults = () => {
    setResults([]);
  };

  const runQuickTest = async () => {
    setIsRunning(true);
    clearResults();
    
    addResult('🚀 开始快速Flow连接测试...', 'info');
    
    try {
      // 1. 配置FCL
      addResult('⚙️ 配置FCL...', 'info');
      fcl.config({
        'flow.network': 'testnet',
        'accessNode.api': 'https://access-testnet.onflow.org',
        'discovery.wallet': 'https://fcl-discovery.onflow.org/testnet/authn',
        'app.detail.title': 'FlowTune Quick Test',
        'app.detail.icon': 'https://flowtune.com/icon.png'
      });
      
      addResult('✅ FCL配置完成', 'success');
      
      // 2. 验证配置
      const config = {
        network: await fcl.config().get('flow.network'),
        accessNode: await fcl.config().get('accessNode.api'),
        discoveryWallet: await fcl.config().get('discovery.wallet')
      };
      
      addResult(`📋 网络: ${config.network}`, 'info');
      addResult(`📋 访问节点: ${config.accessNode}`, 'info');
      addResult(`📋 钱包发现: ${config.discoveryWallet}`, 'info');
      
      // 3. 测试最简单的查询
      addResult('🧪 执行测试查询...', 'info');
      
      const result = await fcl.query({
        cadence: `
          access(all) fun main(): String {
            return "Hello from Flow Testnet!"
          }
        `
      });
      
      addResult(`🎉 查询成功! 结果: ${result}`, 'success');
      
      // 4. 测试网络参数查询
      addResult('🌐 测试网络参数查询...', 'info');
      
      const networkResult = await fcl.query({
        cadence: `
          import FlowToken from 0x7e60df042a9c0868
          
          access(all) fun main(): UFix64 {
            return FlowToken.totalSupply
          }
        `
      });
      
      addResult(`💰 Flow代币总供应量: ${networkResult}`, 'success');
      
      addResult('🎯 所有测试通过! Flow连接已修复!', 'success');
      
    } catch (error) {
      console.error('Flow测试错误:', error);
      
      if (error.message.includes('does not appear to be a valid REST/HTTP access node')) {
        addResult('❌ 访问节点验证失败', 'error');
        addResult('💡 建议: 检查accessNode.api配置', 'warning');
      } else if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
        addResult('❌ 网络请求失败 (可能是CORS问题)', 'error');
        addResult('💡 建议: 使用后端代理或检查网络连接', 'warning');
      } else {
        addResult(`❌ 测试失败: ${error.message}`, 'error');
      }
    }
    
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
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Flow连接快速测试</h2>
        
        <div className="mb-4 space-x-2">
          <button
            onClick={runQuickTest}
            disabled={isRunning}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-6 py-2 rounded"
          >
            {isRunning ? '测试中...' : '开始快速测试'}
          </button>
          
          <button
            onClick={clearResults}
            disabled={isRunning}
            className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white px-4 py-2 rounded"
          >
            清除结果
          </button>
        </div>

        <div className="bg-gray-900 rounded-lg p-4 h-80 overflow-y-auto font-mono text-sm">
          {results.length === 0 ? (
            <p className="text-gray-400">点击"开始快速测试"来验证Flow连接...</p>
          ) : (
            <div className="space-y-1">
              {results.map((result, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <span className="text-gray-500 text-xs min-w-[60px]">
                    {result.timestamp}
                  </span>
                  <span className={`${getResultColor(result.type)} whitespace-pre-wrap`}>
                    {result.message}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 bg-blue-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2 text-blue-800">测试内容</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• FCL配置验证</li>
            <li>• 基础Cadence查询测试</li>
            <li>• Flow代币总供应量查询</li>
            <li>• 网络连接稳定性检查</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default QuickFlowTest;