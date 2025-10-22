import React, { useState, useEffect } from 'react';
import * as fcl from '@onflow/fcl';
import config, { flowConfig } from '../config/environment';

const FlowConfigDebug = () => {
  const [debugInfo, setDebugInfo] = useState({});
  const [testResults, setTestResults] = useState([]);

  const addResult = (message, type = 'info') => {
    setTestResults(prev => [...prev, { message, type, timestamp: new Date().toLocaleTimeString() }]);
  };

  useEffect(() => {
    const runDebugTests = async () => {
      try {
        addResult('🚀 Starting Flow configuration debug...');

        // 1. Check environment variables
        addResult('🔧 Checking environment variables...');
        const envVars = {
          VITE_ENVIRONMENT: import.meta.env.VITE_ENVIRONMENT,
          VITE_FLOW_NETWORK: import.meta.env.VITE_FLOW_NETWORK,
          VITE_FLOW_ACCESS_NODE: import.meta.env.VITE_FLOW_ACCESS_NODE,
          VITE_FLOW_DISCOVERY_WALLET: import.meta.env.VITE_FLOW_DISCOVERY_WALLET,
          NODE_ENV: import.meta.env.NODE_ENV,
          MODE: import.meta.env.MODE
        };

        setDebugInfo(prev => ({ ...prev, envVars }));

        Object.entries(envVars).forEach(([key, value]) => {
          if (value) {
            addResult(`✅ ${key}: ${value}`, 'success');
          } else {
            addResult(`⚠️ ${key}: Undefined`, 'warning');
          }
        });

        // 2. Check configuration object
        addResult('📋 Checking configuration object...');
        setDebugInfo(prev => ({ 
          ...prev, 
          config: {
            ENVIRONMENT: config.ENVIRONMENT,
            API_BASE_URL: config.API_BASE_URL,
            FLOW: config.FLOW
          },
          flowConfig: {
            network: flowConfig.network,
            accessNode: flowConfig.accessNode,
            discoveryWallet: flowConfig.discoveryWallet,
            contracts: flowConfig.contracts
          }
        }));

        addResult(`✅ Current Environment: ${config.ENVIRONMENT}`, 'success');
        addResult(`✅ Flow Network: ${flowConfig.network}`, 'success');
        addResult(`✅ Access Node: ${flowConfig.accessNode}`, 'success');

        // 3. Test network connection
        addResult('📡 Testing Flow REST API connection...');
        try {
          const response = await window.fetch(`${flowConfig.accessNode}/v1/network/parameters`);
          if (response.ok) {
            const data = await response.json();
            addResult(`✅ REST API connection successful, Chain ID: ${data.chain_id}`, 'success');
          } else {
            addResult(`❌ REST API connection failed, Status code: ${response.status}`, 'error');
          }
        } catch (fetchError) {
          addResult(`❌ REST API connection error: ${fetchError.message}`, 'error');
        }

        // 4. Test Flow access node
        addResult('🔄 Testing Flow access node...');
        try {
          const accessNodeResponse = await window.fetch(`${flowConfig.accessNode}/v1/network/parameters`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            }
          });
          if (accessNodeResponse.ok) {
            const accessNodeData = await accessNodeResponse.json();
            addResult(`✅ Flow access node connection successful, Chain ID: ${accessNodeData.chain_id}`, 'success');
          } else {
            addResult(`⚠️ Flow access node response abnormal, Status code: ${accessNodeResponse.status}`, 'warning');
          }
        } catch (accessNodeError) {
          addResult(`❌ Flow access node test failed: ${accessNodeError.message}`, 'error');
        }

        // 5. Test direct CORS
        addResult('🌐 Testing direct CORS policy...');
        try {
          const corsResponse = await window.fetch(`${flowConfig.accessNode}/v1/network/parameters`, {
            method: 'GET',
            mode: 'cors',
            headers: {
              'Content-Type': 'application/json',
            }
          });
          if (corsResponse.ok) {
            addResult(`✅ Direct CORS check passed`, 'success');
          } else {
            addResult(`⚠️ Direct CORS may have issues, status code: ${corsResponse.status}`, 'warning');
          }
        } catch (corsError) {
          if (corsError.message.includes('CORS')) {
            addResult(`❌ Direct CORS error: ${corsError.message}`, 'error');
            addResult(`💡 Suggestion: Use proxy path /api/flow-proxy`, 'info');
          } else {
            addResult(`⚠️ Direct CORS test failed: ${corsError.message}`, 'warning');
          }
        }

        // 6. Test FCL configuration
        addResult('🔧 Testing FCL configuration...');
        try {
          // Use chained configuration method
          console.log('Configuring FCL...');
          
          fcl.config()
            .put('flow.network', flowConfig.network)
            .put('accessNode.api', flowConfig.accessNode)
            .put('discovery.wallet', flowConfig.discoveryWallet)
            .put('app.detail.title', 'FlowTune Debug')
            .put('app.detail.icon', 'https://flowtune.com/icon.png');

          // 等待配置生效
          await new Promise(resolve => setTimeout(resolve, 200));

          // 验证配置
          const fclConfig = {
            network: await fcl.config().get('flow.network'),
            accessNode: await fcl.config().get('accessNode.api'),
            discoveryWallet: await fcl.config().get('discovery.wallet')
          };

          addResult(`📋 FCL Config - Network: ${fclConfig.network}`, 'info');
          addResult(`📋 FCL Config - Access Node: ${fclConfig.accessNode}`, 'info');
          addResult(`📋 FCL Config - Wallet Discovery: ${fclConfig.discoveryWallet}`, 'info');

          // 7. Test simplest query
          addResult('🧪 Testing FCL query...');
          
          // 使用最基本的脚本
          const result = await fcl.query({
            cadence: `
              access(all) fun main(): String {
                return "Hello Flow"
              }
            `
          });

          addResult(`✅ FCL query successful: ${result}`, 'success');

        } catch (fclError) {
          console.error('FCL query detailed error:', fclError);
          
          // Provide more detailed error information
          let errorMessage = fclError.message || fclError.toString();
          
          if (errorMessage.includes('HTTP Request Error') || errorMessage.includes('Failed to fetch')) {
            addResult(`❌ FCL network request error`, 'error');
            addResult(`🔍 Possible causes:`, 'info');
            addResult(`   1. CORS policy blocking request`, 'info');
            addResult(`   2. Access node URL configuration error`, 'info');
            addResult(`   3. Network connection issue`, 'info');
            addResult(`   4. Browser security policy restriction`, 'info');
          } else if (errorMessage.includes('does not appear to be a valid REST/HTTP access node')) {
            addResult(`❌ Access node validation failed`, 'error');
            addResult(`🔍 Try solutions:`, 'info');
            addResult(`   1. Confirm using correct REST endpoint`, 'info');
            addResult(`   2. Check network configuration`, 'info');
            addResult(`   3. Verify FCL version compatibility`, 'info');
          } else {
            addResult(`❌ FCL test failed: ${errorMessage}`, 'error');
          }
          
          console.error('FCL error details:', fclError);
        }

        addResult('🎉 Flow configuration debug completed!', 'success');

      } catch (error) {
        addResult(`❌ Error occurred during debugging: ${error.message}`, 'error');
        console.error('Flow configuration debug error:', error);
      }
    };

    runDebugTests();
  }, []);

  const getResultStyle = (type) => {
    const baseStyle = {
      padding: '8px 12px',
      margin: '4px 0',
      borderRadius: '4px',
      fontSize: '14px',
      fontFamily: 'monospace'
    };

    switch (type) {
      case 'success':
        return { ...baseStyle, backgroundColor: '#d4edda', color: '#155724' };
      case 'error':
        return { ...baseStyle, backgroundColor: '#f8d7da', color: '#721c24' };
      case 'warning':
        return { ...baseStyle, backgroundColor: '#fff3cd', color: '#856404' };
      default:
        return { ...baseStyle, backgroundColor: '#d1ecf1', color: '#0c5460' };
    }
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      width: '400px', 
      maxHeight: '80vh', 
      overflow: 'auto',
      backgroundColor: 'white', 
      border: '1px solid #ccc', 
      borderRadius: '8px',
      padding: '16px',
      zIndex: 9999,
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    }}>
      <h3 style={{ margin: '0 0 16px 0', color: '#333' }}>Flow Configuration Debug</h3>
      
      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>Test Results:</h4>
        <div style={{ maxHeight: '300px', overflow: 'auto' }}>
          {testResults.map((result, index) => (
            <div key={index} style={getResultStyle(result.type)}>
              <span style={{ fontSize: '12px', opacity: 0.7 }}>[{result.timestamp}]</span> {result.message}
            </div>
          ))}
        </div>
      </div>

      {Object.keys(debugInfo).length > 0 && (
        <details style={{ marginTop: '16px' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Detailed Configuration Info</summary>
          <pre style={{ 
            fontSize: '12px', 
            backgroundColor: '#f8f9fa', 
            padding: '8px', 
            borderRadius: '4px',
            overflow: 'auto',
            maxHeight: '200px'
          }}>
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
};

export default FlowConfigDebug;