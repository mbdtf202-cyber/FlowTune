import { wsConfig, flowConfig } from '../config/environment';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = wsConfig.reconnectAttempts || 5;
    this.reconnectDelay = wsConfig.reconnectInterval || 1000;
    this.listeners = new Map();
    this.isConnected = false;
    this.userId = null;
    this.isLocalMode = flowConfig.demoMode || flowConfig.localMode || flowConfig.disableNetworkCalls;
  }

  connect(userId = null) {
    // Simulate connection in local mode
    if (this.isLocalMode) {
      console.log('🏠 Local mode: Simulating WebSocket connection');
      this.isConnected = true;
      setTimeout(() => {
        this.emit('connected');
      }, 100);
      return Promise.resolve();
    }

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        this.userId = userId;
        const wsUrl = wsConfig.url;
        console.log('Connecting to WebSocket:', wsUrl);
        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
          console.log('WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          
          // Send authentication if userId is provided
          if (this.userId) {
            this.send({
              type: 'auth',
              userId: this.userId
            });
          }
          
          resolve();
        };

        this.socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.socket.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          this.isConnected = false;
          this.handleReconnect();
        };

        this.socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.isConnected = false;
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect() {
    if (this.isLocalMode) {
      console.log('🏠 Local mode: Simulating WebSocket disconnect');
      this.isConnected = false;
      return;
    }
    
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.isConnected = false;
    }
  }

  send(data) {
    if (this.isLocalMode) {
      console.log('🏠 Local mode: Simulating WebSocket send:', data);
      return true;
    }
    
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
      return true;
    } else {
      console.warn('WebSocket not connected, cannot send message');
      return false;
    }
  }

  handleMessage(data) {
    const { type } = data;
    
    // Handle system messages
    if (type === 'pong') {
      return; // Heartbeat response
    }

    // Emit to listeners
    if (this.listeners.has(type)) {
      this.listeners.get(type).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in WebSocket listener:', error);
        }
      });
    }

    // Emit to 'all' listeners
    if (this.listeners.has('all')) {
      this.listeners.get('all').forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in WebSocket listener:', error);
        }
      });
    }
  }

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        this.connect(this.userId).catch(error => {
          console.error('Reconnection failed:', error);
        });
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  on(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType).add(callback);
  }

  off(eventType, callback) {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType).delete(callback);
    }
  }

  // Emit event to listeners
  emit(eventType, data) {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in WebSocket listener:', error);
        }
      });
    }
  }

  // Convenience methods for common notification types
  onNotification(callback) {
    this.on('notification', callback);
  }

  onMarketUpdate(callback) {
    this.on('market_data_updated', callback);
  }

  onUserActivity(callback) {
    this.on('user_activity', callback);
  }

  onSystemMessage(callback) {
    this.on('system_message', callback);
  }

  // Send ping to keep connection alive
  ping() {
    if (this.isLocalMode) {
      console.log('🏠 Local mode: Simulating ping');
      return;
    }
    this.send({ type: 'ping' });
  }

  // Start heartbeat
  startHeartbeat(interval = 30000) {
    if (this.isLocalMode) {
      console.log('🏠 Local mode: Simulating heartbeat start');
      return;
    }
    
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected) {
        this.ping();
      }
    }, interval);
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      readyState: this.socket ? this.socket.readyState : WebSocket.CLOSED,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

// Create singleton instance
const websocketService = new WebSocketService();

export default websocketService;