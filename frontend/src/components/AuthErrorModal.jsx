import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { 
  ExclamationTriangleIcon, 
  WifiIcon, 
  ArrowPathIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline'

const AuthErrorModal = ({ isOpen, onClose }) => {
  const { networkError, retryConnection, login } = useAuth()

  if (!isOpen || !networkError) return null

  const isWalletError = networkError?.message?.includes('钱包') || 
                       networkError?.message?.includes('declined') ||
                       networkError?.message?.includes('Declined')
  
  const isNetworkError = networkError?.message?.includes('网络') ||
                        networkError?.message?.includes('network') ||
                        networkError?.message?.includes('ABORTED')

  const handleRetry = async () => {
    if (isWalletError) {
      // For wallet errors, try to authenticate again
      await login()
    } else {
      // For network errors, retry connection
      retryConnection()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${isWalletError ? 'bg-orange-100' : 'bg-red-100'}`}>
              {isWalletError ? (
                <ExclamationTriangleIcon className={`w-6 h-6 ${isWalletError ? 'text-orange-600' : 'text-red-600'}`} />
              ) : (
                <WifiIcon className="w-6 h-6 text-red-600" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {isWalletError ? 'Wallet Connection Issue' : 'Network Connection Issue'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Error Message */}
        <div className="mb-6">
          <p className="text-gray-700 mb-4">
            {networkError.message}
          </p>
          
          {isWalletError && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="font-medium text-orange-800 mb-2">Solutions:</h4>
              <ul className="text-sm text-orange-700 space-y-1">
                <li>• Make sure your wallet app is open</li>
                <li>• Approve the connection request in your wallet</li>
                <li>• Check if your wallet supports Flow network</li>
              </ul>
            </div>
          )}
          
          {isNetworkError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-medium text-red-800 mb-2">Solutions:</h4>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Check your network connection</li>
                <li>• Try refreshing the page</li>
                <li>• Try again later</li>
              </ul>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          <button
            onClick={handleRetry}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <ArrowPathIcon className="w-4 h-4" />
            <span>{isWalletError ? 'Reconnect Wallet' : 'Retry Connection'}</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Try Later
          </button>
        </div>
      </div>
    </div>
  )
}

export default AuthErrorModal