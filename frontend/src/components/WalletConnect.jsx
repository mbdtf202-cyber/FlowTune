import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Wallet, LogOut, Settings, User, CheckCircle, AlertCircle } from 'lucide-react'
import LocalModeUserSwitcher from './LocalModeUserSwitcher'

const WalletConnect = () => {
  const { 
    user, 
    login, 
    logout, 
    initializeAccount, 
    isAuthenticated, 
    loading, 
    isSettingUp,
    isLocalMode 
  } = useAuth()
  const [showAccountSetup, setShowAccountSetup] = useState(false)
  const [setupStatus, setSetupStatus] = useState(null)

  const handleLogin = async () => {
    try {
      await login()
      setShowAccountSetup(true)
    } catch (error) {
      console.error('Login failed:', error)
    }
  }

  const handleAccountSetup = async () => {
    try {
      setSetupStatus('loading')
      const result = await initializeAccount()
      setSetupStatus('success')
      setTimeout(() => {
        setShowAccountSetup(false)
        setSetupStatus(null)
      }, 2000)
    } catch (error) {
      console.error('Account setup failed:', error)
      setSetupStatus('error')
    }
  }

  const formatAddress = (address) => {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
        <span className="text-sm text-gray-600">Connecting...</span>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <button
        onClick={handleLogin}
        className="btn-primary flex items-center space-x-2"
        disabled={loading}
      >
        <Wallet className="h-4 w-4" />
        <span>Connect Wallet</span>
      </button>
    )
  }

  return (
    <div className="relative">
      {/* Local mode user switcher */}
      {isLocalMode && (
        <div className="mb-4">
          <LocalModeUserSwitcher />
        </div>
      )}
      
      <div className="flex items-center space-x-4">
        {/* User Info */}
        <div className="flex items-center space-x-2 bg-white rounded-lg px-3 py-2 border border-gray-200">
          <div className="h-8 w-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
            {isLocalMode && user?.avatar ? (
              <span className="text-sm">{user.avatar}</span>
            ) : (
              <User className="h-4 w-4 text-white" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900">
              {isLocalMode && user?.name ? user.name : formatAddress(user.addr)}
            </span>
            <span className="text-xs text-gray-500">
              {isLocalMode ? 'Local Demo Wallet' : 'Flow Wallet'}
            </span>
          </div>
        </div>

        {/* Account Setup Button - Automatically skipped in local mode */}
        {showAccountSetup && !isLocalMode && (
          <button
            onClick={handleAccountSetup}
            disabled={isSettingUp || setupStatus === 'success'}
            className={`btn-outline flex items-center space-x-2 ${
              setupStatus === 'success' ? 'bg-green-50 border-green-200 text-green-700' :
              setupStatus === 'error' ? 'bg-red-50 border-red-200 text-red-700' : ''
            }`}
          >
            {isSettingUp ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                <span>Setting up...</span>
              </>
            ) : setupStatus === 'success' ? (
              <>
                <CheckCircle className="h-4 w-4" />
                <span>Setup Complete</span>
              </>
            ) : setupStatus === 'error' ? (
              <>
                <AlertCircle className="h-4 w-4" />
                <span>Setup Failed</span>
              </>
            ) : (
              <>
                <Settings className="h-4 w-4" />
                <span>Setup Account</span>
              </>
            )}
          </button>
        )}

        {/* Logout Button */}
        <button
          onClick={logout}
          className="btn-secondary flex items-center space-x-2"
          disabled={loading}
        >
          <LogOut className="h-4 w-4" />
          <span>Disconnect</span>
        </button>
      </div>

      {/* Account Setup Modal */}
      {showAccountSetup && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-primary-600" />
              <h3 className="font-medium text-gray-900">Account Setup Required</h3>
            </div>
            <p className="text-sm text-gray-600">
              Initialize your account with FlowTune resources to start creating and trading music NFTs.
            </p>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Music NFT Collection</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Marketplace Storefront</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Royalty Distributor</span>
              </div>
            </div>
            {setupStatus === 'error' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">
                  Account setup failed. Please try again or check your wallet connection.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default WalletConnect