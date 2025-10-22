import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';

class WebSocketService {
  constructor() {
    this.wss = null;
    this.clients = new Map(); // Map of userId -> Set of WebSocket connections
    this.rooms = new Map(); // Map of roomId -> Set of userIds
  }

  initialize(server) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws',
      verifyClient: this.verifyClient.bind(this)
    });

    this.wss.on('connection', this.handleConnection.bind(this));
    logger.info('WebSocket server initialized');
  }

  verifyClient(info) {
    try {
      const url = new URL(info.req.url, 'http://localhost');
      const token = url.searchParams.get('token');
      
      // In development mode, allow anonymous connections
      if (process.env.NODE_ENV === 'development' || !token) {
        info.req.user = { id: 'anonymous', role: 'user' };
        return true;
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
      info.req.user = decoded;
      return true;
    } catch (error) {
      logger.warn('WebSocket connection rejected: Invalid token', { error: error.message });
      // In development mode, still allow connection as anonymous
      if (process.env.NODE_ENV === 'development') {
        info.req.user = { id: 'anonymous', role: 'user' };
        return true;
      }
      return false;
    }
  }

  handleConnection(ws, req) {
    const userId = req.user.id;
    logger.info('WebSocket client connected', { userId });

    // Add client to user's connection set
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
    }
    this.clients.get(userId).add(ws);

    // Send welcome message
    this.sendToClient(ws, {
      type: 'connection',
      message: 'Connected to FlowTune notifications',
      timestamp: new Date().toISOString()
    });

    // Handle messages from client
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(ws, userId, message);
      } catch (error) {
        logger.error('Error parsing WebSocket message', { error: error.message });
      }
    });

    // Handle client disconnect
    ws.on('close', () => {
      this.handleDisconnect(userId, ws);
    });

    // Handle errors
    ws.on('error', (error) => {
      logger.error('WebSocket error', { userId, error: error.message });
    });
  }

  handleMessage(ws, userId, message) {
    switch (message.type) {
      case 'join_room':
        this.joinRoom(userId, message.roomId);
        break;
      case 'leave_room':
        this.leaveRoom(userId, message.roomId);
        break;
      case 'ping':
        this.sendToClient(ws, { type: 'pong', timestamp: new Date().toISOString() });
        break;
      default:
        logger.warn('Unknown WebSocket message type', { type: message.type, userId });
    }
  }

  handleDisconnect(userId, ws) {
    logger.info('WebSocket client disconnected', { userId });
    
    // Remove client from user's connection set
    if (this.clients.has(userId)) {
      this.clients.get(userId).delete(ws);
      if (this.clients.get(userId).size === 0) {
        this.clients.delete(userId);
      }
    }

    // Remove user from all rooms if no more connections
    if (!this.clients.has(userId)) {
      for (const [roomId, users] of this.rooms.entries()) {
        users.delete(userId);
        if (users.size === 0) {
          this.rooms.delete(roomId);
        }
      }
    }
  }

  joinRoom(userId, roomId) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    this.rooms.get(roomId).add(userId);
    logger.info('User joined room', { userId, roomId });
  }

  leaveRoom(userId, roomId) {
    if (this.rooms.has(roomId)) {
      this.rooms.get(roomId).delete(userId);
      if (this.rooms.get(roomId).size === 0) {
        this.rooms.delete(roomId);
      }
    }
    logger.info('User left room', { userId, roomId });
  }

  sendToClient(ws, data) {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  // Send notification to specific user
  sendToUser(userId, notification) {
    if (this.clients.has(userId)) {
      const userConnections = this.clients.get(userId);
      userConnections.forEach(ws => {
        this.sendToClient(ws, {
          type: 'notification',
          ...notification,
          timestamp: new Date().toISOString()
        });
      });
      logger.info('Notification sent to user', { userId, type: notification.type });
    }
  }

  // Send notification to all users in a room
  sendToRoom(roomId, notification) {
    if (this.rooms.has(roomId)) {
      const users = this.rooms.get(roomId);
      users.forEach(userId => {
        this.sendToUser(userId, notification);
      });
      logger.info('Notification sent to room', { roomId, userCount: users.size, type: notification.type });
    }
  }

  // Broadcast notification to all connected users
  broadcast(notification) {
    this.clients.forEach((connections, userId) => {
      this.sendToUser(userId, notification);
    });
    logger.info('Notification broadcasted', { userCount: this.clients.size, type: notification.type });
  }

  // Send activity update
  sendActivityUpdate(userId, activity) {
    this.sendToUser(userId, {
      type: 'activity',
      activity,
      timestamp: new Date().toISOString()
    });
  }

  // Send market update
  sendMarketUpdate(nftData) {
    this.broadcast({
      type: 'market_update',
      data: nftData,
      timestamp: new Date().toISOString()
    });
  }

  // Send new music notification
  sendNewMusicNotification(musicData, creatorId) {
    // Send to creator
    this.sendToUser(creatorId, {
      type: 'music_created',
      data: musicData,
      message: 'Your music has been successfully created!'
    });

    // Broadcast to all users (could be filtered by followers in the future)
    this.broadcast({
      type: 'new_music',
      data: musicData,
      message: `New music "${musicData.title}" is now available!`
    });
  }

  // Send purchase notification
  sendPurchaseNotification(purchaseData) {
    const { buyerId, sellerId, nftData } = purchaseData;

    // Notify buyer
    this.sendToUser(buyerId, {
      type: 'purchase_success',
      data: nftData,
      message: `You successfully purchased "${nftData.title}"!`
    });

    // Notify seller
    this.sendToUser(sellerId, {
      type: 'sale_success',
      data: nftData,
      message: `Your music "${nftData.title}" has been sold!`
    });
  }

  // Send follow notification
  sendFollowNotification(followerId, followedId, followerData) {
    this.sendToUser(followedId, {
      type: 'new_follower',
      data: followerData,
      message: `${followerData.username} started following you!`
    });
  }

  // Send comment notification
  sendCommentNotification(commentData) {
    const { musicOwnerId, commenterData, musicData } = commentData;

    this.sendToUser(musicOwnerId, {
      type: 'new_comment',
      data: {
        commenter: commenterData,
        music: musicData,
        comment: commentData.content
      },
      message: `${commenterData.username} commented on your music "${musicData.title}"`
    });
  }

  // Get connection stats
  getStats() {
    return {
      connectedUsers: this.clients.size,
      totalConnections: Array.from(this.clients.values()).reduce((sum, connections) => sum + connections.size, 0),
      activeRooms: this.rooms.size
    };
  }
}

export default new WebSocketService();