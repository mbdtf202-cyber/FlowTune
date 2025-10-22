import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Test endpoint without authentication for development
router.post('/test-broadcast', (req, res) => {
  try {
    const { message, type = 'test' } = req.body;

    if (!global.websocketService) {
      return res.status(503).json({
        success: false,
        message: 'WebSocket service not available'
      });
    }

    global.websocketService.broadcast({
      type,
      message: message || 'Test broadcast notification',
      data: { sender: 'system', timestamp: new Date().toISOString() }
    });

    res.json({
      success: true,
      message: 'Test broadcast notification sent'
    });
  } catch (error) {
    logger.error('Error sending test broadcast', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to send test broadcast'
    });
  }
});

// Get WebSocket connection stats (admin only)
router.get('/stats', authenticateToken, (req, res) => {
  try {
    if (!global.websocketService) {
      return res.status(503).json({
        success: false,
        message: 'WebSocket service not available'
      });
    }

    const stats = global.websocketService.getStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error getting WebSocket stats', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to get WebSocket stats'
    });
  }
});

// Send test notification to user
router.post('/test/:userId', authenticateToken, (req, res) => {
  try {
    const { userId } = req.params;
    const { message, type = 'test' } = req.body;

    if (!global.websocketService) {
      return res.status(503).json({
        success: false,
        message: 'WebSocket service not available'
      });
    }

    global.websocketService.sendToUser(userId, {
      type,
      message: message || 'Test notification',
      data: { sender: req.user.id }
    });

    res.json({
      success: true,
      message: 'Test notification sent'
    });
  } catch (error) {
    logger.error('Error sending test notification', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to send test notification'
    });
  }
});

// Broadcast notification to all users (admin only)
router.post('/broadcast', authenticateToken, (req, res) => {
  try {
    const { message, type = 'announcement' } = req.body;

    if (!global.websocketService) {
      return res.status(503).json({
        success: false,
        message: 'WebSocket service not available'
      });
    }

    global.websocketService.broadcast({
      type,
      message: message || 'System announcement',
      data: { sender: 'system' }
    });

    res.json({
      success: true,
      message: 'Broadcast notification sent'
    });
  } catch (error) {
    logger.error('Error broadcasting notification', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to broadcast notification'
    });
  }
});

// Send notification to room
router.post('/room/:roomId', authenticateToken, (req, res) => {
  try {
    const { roomId } = req.params;
    const { message, type = 'room_message' } = req.body;

    if (!global.websocketService) {
      return res.status(503).json({
        success: false,
        message: 'WebSocket service not available'
      });
    }

    global.websocketService.sendToRoom(roomId, {
      type,
      message: message || 'Room notification',
      data: { sender: req.user.id, roomId }
    });

    res.json({
      success: true,
      message: 'Room notification sent'
    });
  } catch (error) {
    logger.error('Error sending room notification', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to send room notification'
    });
  }
});

export default router;