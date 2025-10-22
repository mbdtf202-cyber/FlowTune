import { flowConfig } from '../config/environment.js';

class WebSocketService {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 3000;
    this.listeners = new Map();
    this.isConnecting = false;
    this.heartbeatInterval = null;
    this.heartbeatTimeout = null;
    this.currentUrl = null;
    this.isLocalMode = flowConfig.demoMode || flowConfig.localMode || flowConfig.disableNetworkCalls;
  }

  connect(url) {
    const targetUrl = url || this.currentUrl || 'ws://localhost:3002/ws';
    
    // Simulate connection in local mode
    if (this.isLocalMode) {
      console.log('🏠 Local mode: Simulating WebSocket connection');
      setTimeout(() => {
        this.emit('connected');
      }, 100);
      return Promise.resolve();
    }
    
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return Promise.resolve();
    }

    this.isConnecting = true;
    this.currentUrl = targetUrl;

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(targetUrl);

        this.ws.onopen = () => {
          console.log('WebSocket connection established');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.emit('connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket connection closed:', event.code, event.reason);
          this.isConnecting = false;
          this.stopHeartbeat();
          this.emit('disconnected', { code: event.code, reason: event.reason });
          
          if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.isConnecting = false;
          this.emit('error', error);
          reject(error);
        };

      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  scheduleReconnect() {
    this.reconnectAttempts++;
    const delay = this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.connect(this.currentUrl);
    }, delay);
  }

  disconnect() {
    if (this.ws) {
      this.stopHeartbeat();
      this.ws.close(1000, 'Client initiated disconnect');
      this.ws = null;
    }
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
      return true;
    }
    console.warn('WebSocket not connected, unable to send message');
    return false;
  }

  subscribe(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    // Return unsubscribe function
    return () => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.delete(callback);
        if (eventListeners.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  emit(event, data) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Event listener execution failed (${event}):`, error);
        }
      });
    }
  }

  handleMessage(data) {
    const { type, payload } = data;

    switch (type) {
      case 'nft_created':
        this.emit('nftCreated', payload);
        break;
      case 'nft_updated':
        this.emit('nftUpdated', payload);
        break;
      case 'nft_deleted':
        this.emit('nftDeleted', payload);
        break;
      case 'play_count_updated':
        this.emit('playCountUpdated', payload);
        break;
      case 'like_updated':
        this.emit('likeUpdated', payload);
        break;
      case 'user_stats_updated':
        this.emit('userStatsUpdated', payload);
        break;
      case 'market_data_updated':
        this.emit('marketDataUpdated', payload);
        break;
      case 'pong':
        this.handlePong();
        break;
      default:
        console.log('Unknown WebSocket message type:', type);
    }
  }

  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping' });
        
        // Set heartbeat timeout
        this.heartbeatTimeout = setTimeout(() => {
          console.warn('Heartbeat timeout, closing connection');
          this.ws.close();
        }, 5000);
      }
    }, 30000); // Send heartbeat every 30 seconds
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }

  handlePong() {
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }

  getConnectionState() {
    if (!this.ws) return 'CLOSED';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'CONNECTING';
      case WebSocket.OPEN:
        return 'OPEN';
      case WebSocket.CLOSING:
        return 'CLOSING';
      case WebSocket.CLOSED:
        return 'CLOSED';
      default:
        return 'UNKNOWN';
    }
  }
}

// Create singleton instance
const websocketService = new WebSocketService();

export default websocketService;