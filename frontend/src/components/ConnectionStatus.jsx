import React from 'react'
import { useRealTimeData } from '../hooks/useWebSocket'
import { Wifi, WifiOff, Clock } from 'lucide-react'

const ConnectionStatus = ({ className = '' }) => {
  const { isConnected, lastUpdateTime, connectionStatus } = useRealTimeData()

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'text-green-500'
      case 'connecting':
        return 'text-yellow-500'
      case 'disconnected':
        return 'text-red-500'
      default:
        return 'text-gray-500'
    }
  }

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Real-time Connected'
      case 'connecting':
        return 'Connecting...'
      case 'disconnected':
        return 'Disconnected'
      default:
        return 'Not Connected'
    }
  }

  const formatLastUpdate = () => {
    if (!lastUpdateTime) return ''
    const now = Date.now()
    const diff = now - lastUpdateTime
    
    if (diff < 60000) { // Less than 1 minute
      return 'Just updated'
    } else if (diff < 3600000) { // Less than 1 hour
      const minutes = Math.floor(diff / 60000)
      return `Updated ${minutes} minutes ago`
    } else {
      const hours = Math.floor(diff / 3600000)
      return `Updated ${hours} hours ago`
    }
  }

  return (
    <div className={`flex items-center space-x-2 text-sm ${className}`}>
      <div className="flex items-center space-x-1">
        {isConnected ? (
          <Wifi className={`w-4 h-4 ${getStatusColor()}`} />
        ) : (
          <WifiOff className={`w-4 h-4 ${getStatusColor()}`} />
        )}
        <span className={getStatusColor()}>
          {getStatusText()}
        </span>
      </div>
      
      {lastUpdateTime && (
        <div className="flex items-center space-x-1 text-gray-500">
          <Clock className="w-3 h-3" />
          <span className="text-xs">
            {formatLastUpdate()}
          </span>
        </div>
      )}
      
      {/* 连接状态指示点 */}
      <div className="relative">
        <div className={`w-2 h-2 rounded-full ${
          isConnected ? 'bg-green-500' : 'bg-red-500'
        }`}>
          {isConnected && (
            <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping opacity-75"></div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ConnectionStatus