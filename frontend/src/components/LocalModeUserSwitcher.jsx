import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { 
  UserIcon, 
  ChevronDownIcon, 
  CheckIcon,
  CogIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

const LocalModeUserSwitcher = () => {
  const { 
    isLocalMode, 
    user, 
    switchUser, 
    getAvailableUsers, 
    getWalletStatus,
    isAuthenticated 
  } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [switching, setSwitching] = useState(false)

  // 如果不是本地模式，不显示组件
  if (!isLocalMode) {
    return null
  }

  const availableUsers = getAvailableUsers ? getAvailableUsers() : []
  const walletStatus = getWalletStatus ? getWalletStatus() : {}

  const handleUserSwitch = async (userIndex) => {
    if (!switchUser || switching) return
    
    try {
      setSwitching(true)
      await switchUser(userIndex)
      setIsOpen(false)
    } catch (error) {
      console.error('Failed to switch user:', error)
    } finally {
      setSwitching(false)
    }
  }

  const currentUser = availableUsers.find(u => u.isCurrent) || user

  return (
    <div className="relative">
      {/* Local Mode Indicator */}
      <div className="mb-2 flex items-center space-x-2 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-md">
        <CogIcon className="h-3 w-3" />
        <span>Local Demo Mode</span>
      </div>

      {/* 用户切换器 */}
      {isAuthenticated && (
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            disabled={switching}
            className="flex items-center space-x-2 bg-white border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors w-full min-w-[200px]"
          >
            <div className="flex items-center space-x-2 flex-1">
              <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm">
                {currentUser?.avatar || '👤'}
              </div>
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium text-gray-900">
                  {currentUser?.name || 'Demo User'}
                </span>
                <span className="text-xs text-gray-500">
                  {currentUser?.addr ? `${currentUser.addr.slice(0, 6)}...${currentUser.addr.slice(-4)}` : ''}
                </span>
              </div>
            </div>
            {switching ? (
              <ArrowPathIcon className="h-4 w-4 text-gray-400 animate-spin" />
            ) : (
              <ChevronDownIcon className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            )}
          </button>

          {/* 下拉菜单 */}
          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <div className="py-1">
                <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
                  Select Demo User
                </div>
                {availableUsers.map((user, index) => (
                  <button
                    key={user.addr}
                    onClick={() => handleUserSwitch(index)}
                    disabled={switching}
                    className={`w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-50 transition-colors ${
                      user.isCurrent ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="h-6 w-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs">
                      {user.avatar}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {user.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {user.addr.slice(0, 6)}...{user.addr.slice(-4)}
                      </div>
                      <div className="text-xs text-gray-400">
                        Balance: {user.balance.toFixed(2)} {user.currency}
                      </div>
                    </div>
                    {user.isCurrent && (
                      <CheckIcon className="h-4 w-4 text-blue-600" />
                    )}
                  </button>
                ))}
              </div>
              
              {/* Status Information */}
              <div className="border-t border-gray-100 px-3 py-2 bg-gray-50">
                <div className="text-xs text-gray-500 space-y-1">
                  <div>Connection Status: {walletStatus.isConnected ? 'Connected' : 'Not Connected'}</div>
                  <div>Available Users: {availableUsers.length}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Not Connected State */}
      {!isAuthenticated && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <UserIcon className="h-4 w-4" />
            <span>Wallet Not Connected</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Click "Connect Wallet" to start demo
          </div>
        </div>
      )}

      {/* 点击外部关闭下拉菜单 */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}

export default LocalModeUserSwitcher