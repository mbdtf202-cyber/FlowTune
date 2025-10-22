import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, Info, AlertTriangle, AlertCircle } from 'lucide-react';
import websocketService from '../services/websocketService';

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationRef = useRef(null);

  useEffect(() => {
    // Listen for all types of notifications
    const handleNotification = (data) => {
      const notification = {
        id: Date.now() + Math.random(),
        type: data.type || 'info',
        title: getNotificationTitle(data.type),
        message: data.message || data.payload?.message || 'New notification',
        timestamp: new Date(),
        read: false,
        data: data.data || data.payload
      };

      setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Keep last 50
      setUnreadCount(prev => prev + 1);

      // Show browser notification if permission granted and API is available
    if (typeof window !== 'undefined' && 
        typeof window.Notification !== 'undefined' && 
        window.Notification && 
        window.Notification.permission === 'granted' && 
        !document.hasFocus()) {
      try {
        new window.Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico'
        });
      } catch (error) {
        console.warn('Failed to show browser notification:', error);
      }
    }
    };

    // Listen to various notification types
    websocketService.on('notification', handleNotification);
    websocketService.on('market_data_updated', handleNotification);
    websocketService.on('user_activity', handleNotification);
    websocketService.on('system_message', handleNotification);
    websocketService.on('nft_sold', handleNotification);
    websocketService.on('nft_liked', handleNotification);
    websocketService.on('follow', handleNotification);

    return () => {
      websocketService.off('notification', handleNotification);
      websocketService.off('market_data_updated', handleNotification);
      websocketService.off('user_activity', handleNotification);
      websocketService.off('system_message', handleNotification);
      websocketService.off('nft_sold', handleNotification);
      websocketService.off('nft_liked', handleNotification);
      websocketService.off('follow', handleNotification);
    };
  }, []);

  useEffect(() => {
    // Request notification permission if API is available
    if (typeof window !== 'undefined' && 
        typeof window.Notification !== 'undefined' && 
        window.Notification && 
        window.Notification.permission === 'default') {
      try {
        window.Notification.requestPermission();
      } catch (error) {
        console.warn('Failed to request notification permission:', error);
      }
    }
  }, []);

  const getNotificationTitle = (type) => {
    const titles = {
      notification: 'Notification',
      market_data_updated: 'Market Update',
      user_activity: 'User Activity',
      system_message: 'System Message',
      nft_sold: 'NFT Sold',
      nft_liked: 'NFT Liked',
      follow: 'New Follower',
      test: 'Test Notification',
      announcement: 'System Announcement'
    };
    return titles[type] || 'Notification';
  };

  const getNotificationIcon = (type) => {
    const icons = {
      notification: Info,
      market_data_updated: AlertTriangle,
      user_activity: Bell,
      system_message: AlertCircle,
      nft_sold: Check,
      nft_liked: '❤️',
      follow: '👤',
      test: Info,
      announcement: AlertCircle
    };
    return icons[type] || Info;
  };

  const getNotificationColor = (type) => {
    const colors = {
      notification: 'text-blue-500',
      market_data_updated: 'text-yellow-500',
      user_activity: 'text-green-500',
      system_message: 'text-purple-500',
      nft_sold: 'text-green-500',
      nft_liked: 'text-red-500',
      follow: 'text-blue-500',
      test: 'text-gray-500',
      announcement: 'text-orange-500'
    };
    return colors[type] || 'text-gray-500';
  };

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
    setUnreadCount(0);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
    const notification = notifications.find(n => n.id === id);
    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minutes ago`;
    if (hours < 24) return `${hours} hours ago`;
    return `${days} days ago`;
  };

  return (
    <div className="relative" ref={notificationRef}>
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Mark All Read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear All
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell size={32} className="mx-auto mb-2 opacity-50" />
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const IconComponent = getNotificationIcon(notification.type);
                const iconColor = getNotificationColor(notification.type);
                
                return (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 ${iconColor}`}>
                        {typeof IconComponent === 'string' ? (
                          <span className="text-lg">{IconComponent}</span>
                        ) : (
                          <IconComponent size={16} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNotification(notification.id);
                            }}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X size={12} />
                          </button>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatTime(notification.timestamp)}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;