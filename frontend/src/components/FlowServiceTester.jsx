import React, { useState, useRef, useEffect } from 'react';

const FlowServiceTester = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState([]);
  const logContainerRef = useRef(null);

  // 添加日志
  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { message, type, timestamp }]);
  };

  // 清除日志
  const clearLogs = () => {
    setLogs([]);
  };

  // 自动滚动到底部
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // 重写console.log来捕获测试输出
  const captureConsoleOutput = (testFunction) => {
    const originalLog = console.log;
    const originalError = console.error;
    
    console.log = (...args) => {
      const message = args.join(' ');
      if (message.includes('✅')) {
        addLog(message, 'success');
      } else if (message.includes('❌')) {
        addLog(message, 'error');
      } else if (message.includes('⚠️')) {
        addLog(message, 'warning');
      } else if (message.includes('🎯') || message.includes('🎉')) {
        addLog(message, 'success');
      } else {
        addLog(message, 'info');
      }
      originalLog(...args);
    };
    
    console.error = (...args) => {
      const message = args.join(' ');
      addLog(`❌ ${message}`, 'error');
      originalError(...args);
    };
    
    return async () => {
      try {
        await testFunction();
      } finally {
        console.log = originalLog;
        console.error = originalError;
      }
    };
  };

  // 测试新版FlowService V2
  const testFlowServiceV2 = async () => {
    setIsRunning(true);
    clearLogs();
    
    addLog('🚀 Starting FlowService V2 test...', 'info');
    
    const runTest = captureConsoleOutput(async () => {
      try {
        const { default: flowServiceV2 } = await import('../services/flowServiceV2.js');
        
        // 测试初始化
        await flowServiceV2.init();
        
        // 测试连接
        const connectionResult = await flowServiceV2.testConnection();
        
        // 获取网络状态
        const networkStatus = flowServiceV2.getNetworkStatus();
        
        // 获取区块高度
        const blockHeight = await flowServiceV2.getCurrentBlockHeight();
        
        addLog('🎉 FlowService V2 test completed!', 'success');
        
      } catch (error) {
        addLog(`❌ FlowService V2 test failed: ${error.message}`, 'error');
      }
    });
    
    await runTest();
    setIsRunning(false);
  };

  // 测试原版FlowService
  const testOriginalFlowService = async () => {
    setIsRunning(true);
    clearLogs();
    
    addLog('🔍 Starting original FlowService test...', 'info');
    
    const runTest = captureConsoleOutput(async () => {
      try {
        const { default: flowService } = await import('../services/flowService.js');
        
        // 测试初始化
        await flowService.init();
        
        // 测试连接
        await flowService.testConnection();
        
        addLog('✅ Original FlowService test completed!', 'success');
        
      } catch (error) {
        addLog(`❌ Original FlowService test failed: ${error.message}`, 'error');
      }
    });
    
    await runTest();
    setIsRunning(false);
  };

  // 运行比较测试
  const runComparisonTest = async () => {
    setIsRunning(true);
    clearLogs();
    
    addLog('🔄 Starting comparison test...', 'info');
    
    const results = {
      v2: false,
      v1: false
    };
    
    // 测试新版
    addLog('='.repeat(30), 'info');
    addLog('Testing new FlowService V2', 'info');
    addLog('='.repeat(30), 'info');
    
    try {
      const { default: flowServiceV2 } = await import('../services/flowServiceV2.js');
      await flowServiceV2.init();
      await flowServiceV2.testConnection();
      const networkStatus = flowServiceV2.getNetworkStatus();
      addLog(`✅ New version test successful - Current node: ${networkStatus.currentNode}`, 'success');
      results.v2 = true;
    } catch (error) {
      addLog(`❌ New version test failed: ${error.message}`, 'error');
    }
    
    // 等待
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 测试原版
    addLog('='.repeat(30), 'info');
    addLog('Testing original FlowService', 'info');
    addLog('='.repeat(30), 'info');
    
    try {
      const { default: flowService } = await import('../services/flowService.js');
      await flowService.init();
      await flowService.testConnection();
      addLog('✅ Original version test successful', 'success');
      results.v1 = true;
    } catch (error) {
      addLog(`❌ Original version test failed: ${error.message}`, 'error');
    }
    
    // 输出结果
    addLog('='.repeat(30), 'info');
    addLog('Test Results Summary', 'info');
    addLog('='.repeat(30), 'info');
    addLog(`New FlowService V2: ${results.v2 ? '✅ Passed' : '❌ Failed'}`, results.v2 ? 'success' : 'error');
    addLog(`Original FlowService: ${results.v1 ? '✅ Passed' : '❌ Failed'}`, results.v1 ? 'success' : 'error');
    
    if (results.v2 && !results.v1) {
      addLog('🎯 Recommendation: New FlowService V2 is more stable, suggest replacing original version', 'success');
    } else if (results.v1 && !results.v2) {
      addLog('⚠️ Warning: New version has issues, needs further debugging', 'warning');
    } else if (results.v1 && results.v2) {
      addLog('✅ Both versions work normally, can choose to use new version', 'success');
    } else {
      addLog('❌ Both versions have issues, need in-depth debugging', 'error');
    }
    
    setIsRunning(false);
  };

  const getLogColor = (type) => {
    switch (type) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      default: return 'text-blue-600';
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">FlowService Function Tester</h2>
        
        <div className="mb-4 space-x-2 flex flex-wrap gap-2">
          <button
            onClick={testFlowServiceV2}
            disabled={isRunning}
            className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded"
          >
            {isRunning ? 'Testing...' : 'Test New V2'}
          </button>
          
          <button
            onClick={testOriginalFlowService}
            disabled={isRunning}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded"
          >
            {isRunning ? 'Testing...' : 'Test Original V1'}
          </button>
          
          <button
            onClick={runComparisonTest}
            disabled={isRunning}
            className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white px-4 py-2 rounded"
          >
            {isRunning ? 'Testing...' : 'Run Comparison Test'}
          </button>
          
          <button
            onClick={clearLogs}
            disabled={isRunning}
            className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white px-4 py-2 rounded"
          >
            Clear Logs
          </button>
        </div>

        <div className="bg-gray-900 rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm" ref={logContainerRef}>
          {logs.length === 0 ? (
            <p className="text-gray-400">Select a test to start...</p>
          ) : (
            <div className="space-y-1">
              {logs.map((log, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <span className="text-gray-500 text-xs min-w-[60px]">
                    {log.timestamp}
                  </span>
                  <span className={`${getLogColor(log.type)} whitespace-pre-wrap`}>
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Test Instructions */}
        <div className="mt-6 bg-blue-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2 text-blue-800">Test Instructions</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• <strong>Test New V2</strong>: Test all functions of new FlowService V2</li>
            <li>• <strong>Test Original V1</strong>: Test basic functions of original FlowService</li>
            <li>• <strong>Run Comparison Test</strong>: Test both versions simultaneously and compare results</li>
            <li>• Tests include: initialization, network connection, FCL queries, error handling, etc.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FlowServiceTester;