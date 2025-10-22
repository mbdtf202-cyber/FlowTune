import { useEffect, useRef, useState, useCallback } from 'react';
import websocketService from '../services/websocket';

export const useWebSocket = (url, options = {}) => {
  const [connectionState, setConnectionState] = useState('CLOSED');
  const [lastMessage, setLastMessage] = useState(null);
  const [error, setError] = useState(null);
  const subscriptionsRef = useRef(new Set());

  const {
    autoConnect = true,
    reconnectOnClose = true,
    onOpen,
    onClose,
    onError,
    onMessage
  } = options;

  // 连接WebSocket
  const connect = useCallback(async () => {
    try {
      await websocketService.connect(url);
      setConnectionState('OPEN');
      setError(null);
    } catch (err) {
      setError(err);
      setConnectionState('CLOSED');
    }
  }, [url]);

  // 断开连接
  const disconnect = useCallback(() => {
    websocketService.disconnect();
    setConnectionState('CLOSED');
  }, []);

  // 发送消息
  const sendMessage = useCallback((data) => {
    return websocketService.send(data);
  }, []);

  // 订阅事件
  const subscribe = useCallback((event, callback) => {
    const unsubscribe = websocketService.subscribe(event, callback);
    subscriptionsRef.current.add(unsubscribe);
    return unsubscribe;
  }, []);

  useEffect(() => {
    // 订阅连接状态变化
    const unsubscribeConnected = websocketService.subscribe('connected', () => {
      setConnectionState('OPEN');
      onOpen?.();
    });

    const unsubscribeDisconnected = websocketService.subscribe('disconnected', (data) => {
      setConnectionState('CLOSED');
      onClose?.(data);
    });

    const unsubscribeError = websocketService.subscribe('error', (err) => {
      setError(err);
      onError?.(err);
    });

    subscriptionsRef.current.add(unsubscribeConnected);
    subscriptionsRef.current.add(unsubscribeDisconnected);
    subscriptionsRef.current.add(unsubscribeError);

    // 自动连接
    if (autoConnect) {
      connect();
    }

    return () => {
      // 清理所有订阅
      subscriptionsRef.current.forEach(unsubscribe => unsubscribe());
      subscriptionsRef.current.clear();
    };
  }, [url, autoConnect, connect, onOpen, onClose, onError]);

  return {
    connectionState,
    lastMessage,
    error,
    connect,
    disconnect,
    sendMessage,
    subscribe,
    isConnected: connectionState === 'OPEN',
    isConnecting: connectionState === 'CONNECTING'
  };
};

// 专门用于实时数据更新的Hook
export const useRealTimeData = () => {
  const [nftUpdates, setNftUpdates] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [marketData, setMarketData] = useState(null);

  const { subscribe, isConnected } = useWebSocket(
    import.meta.env.VITE_WS_URL || 'ws://localhost:3002/ws'
  );

  useEffect(() => {
    if (!isConnected) return;

    // 订阅NFT相关更新
    const unsubscribeNftCreated = subscribe('nftCreated', (nft) => {
      setNftUpdates(prev => [...prev, { type: 'created', data: nft, timestamp: Date.now() }]);
    });

    const unsubscribeNftUpdated = subscribe('nftUpdated', (nft) => {
      setNftUpdates(prev => [...prev, { type: 'updated', data: nft, timestamp: Date.now() }]);
    });

    const unsubscribeNftDeleted = subscribe('nftDeleted', (nftId) => {
      setNftUpdates(prev => [...prev, { type: 'deleted', data: { id: nftId }, timestamp: Date.now() }]);
    });

    const unsubscribePlayCount = subscribe('playCountUpdated', (data) => {
      setNftUpdates(prev => [...prev, { type: 'playCount', data, timestamp: Date.now() }]);
    });

    const unsubscribeLike = subscribe('likeUpdated', (data) => {
      setNftUpdates(prev => [...prev, { type: 'like', data, timestamp: Date.now() }]);
    });

    // 订阅用户统计更新
    const unsubscribeUserStats = subscribe('userStatsUpdated', (stats) => {
      setUserStats(stats);
    });

    // 订阅市场数据更新
    const unsubscribeMarketData = subscribe('marketDataUpdated', (data) => {
      setMarketData(data);
    });

    return () => {
      unsubscribeNftCreated();
      unsubscribeNftUpdated();
      unsubscribeNftDeleted();
      unsubscribePlayCount();
      unsubscribeLike();
      unsubscribeUserStats();
      unsubscribeMarketData();
    };
  }, [isConnected, subscribe]);

  // 清理旧的更新记录
  useEffect(() => {
    const cleanup = setInterval(() => {
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      setNftUpdates(prev => prev.filter(update => update.timestamp > fiveMinutesAgo));
    }, 60000); // 每分钟清理一次

    return () => clearInterval(cleanup);
  }, []);

  return {
    nftUpdates,
    userStats,
    marketData,
    isConnected,
    clearUpdates: () => setNftUpdates([])
  };
};