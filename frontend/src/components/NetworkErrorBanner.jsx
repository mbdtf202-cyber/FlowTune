import React, { useState } from 'react'
import { AlertTriangle, RefreshCw, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const NetworkErrorBanner = () => {
  const { hasNetworkError, networkError, retryConnection, retryCount } = useAuth()
  const [showTestMode, setShowTestMode] = useState(false)

  // Show test mode in development
  const isDevelopment = import.meta.env.DEV
  
  if (!hasNetworkError && !showTestMode) return null

  return (
    <>
      {isDevelopment && !hasNetworkError && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-2 mb-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700">Development Mode</span>
            <button
              onClick={() => setShowTestMode(!showTestMode)}
              className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200"
            >
              {showTestMode ? 'Hide' : 'Test'} Error Banner
            </button>
          </div>
        </div>
      )}
      
      <div className={`border-l-4 p-4 mb-4 ${showTestMode ? 'bg-yellow-50 border-yellow-400' : 'bg-red-50 border-red-400'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <AlertTriangle className={`h-5 w-5 mr-3 ${showTestMode ? 'text-yellow-400' : 'text-red-400'}`} />
            <div>
              <h3 className={`text-sm font-medium ${showTestMode ? 'text-yellow-800' : 'text-red-800'}`}>
                {showTestMode ? 'Test Mode: ' : ''}
                {networkError?.message?.includes('wallet') || networkError?.message?.includes('钱包') ? 'Wallet Connection Error' : 'Flow Network Connection Error'}
              </h3>
              <p className={`text-sm mt-1 ${showTestMode ? 'text-yellow-700' : 'text-red-700'}`}>
                {showTestMode ? 'This is a test message. ' : ''}
                {networkError?.message || 'Unable to connect to Flow blockchain network. Some features may be limited.'}
                {retryCount > 0 && ` (Retry attempt: ${retryCount}/3)`}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {showTestMode && (
              <button
                onClick={() => setShowTestMode(false)}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                <X className="h-4 w-4 mr-1" />
                Close Test
              </button>
            )}
            <button
              onClick={showTestMode ? () => setShowTestMode(false) : retryConnection}
              className={`inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                showTestMode 
                  ? 'text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:ring-yellow-500'
                  : 'text-red-700 bg-red-100 hover:bg-red-200 focus:ring-red-500'
              }`}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              {showTestMode ? 'Test Retry' : 'Retry'}
            </button>
          </div>
        </div>
        {(networkError || showTestMode) && (
          <details className="mt-2">
            <summary className={`text-sm cursor-pointer hover:${showTestMode ? 'text-yellow-800' : 'text-red-800'} ${showTestMode ? 'text-yellow-600' : 'text-red-600'}`}>
              Technical Details
            </summary>
            <pre className={`text-xs mt-1 p-2 rounded overflow-auto ${showTestMode ? 'text-yellow-600 bg-yellow-100' : 'text-red-600 bg-red-100'}`}>
              {showTestMode 
                ? 'Test Error: This is a simulated network error for testing purposes.'
                : (networkError?.message || JSON.stringify(networkError, null, 2))
              }
            </pre>
          </details>
        )}
      </div>
    </>
  )
}

export default NetworkErrorBanner