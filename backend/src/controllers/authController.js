/**
 * Authentication Controller
 * Handles user authentication, registration, and session management
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { validationResult } from 'express-validator';
import User from '../models/User.js';
import logger from '../utils/logger.js';

class AuthController {
  /**
   * Register a new user
   */
  register = async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { username, email, password, flowAddress } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [
          { email: email.toLowerCase() },
          { username: username.toLowerCase() },
          { 'flowWallet.address': flowAddress }
        ]
      });

      if (existingUser) {
        let message = 'User already exists';
        if (existingUser.email === email.toLowerCase()) {
          message = 'Email already registered';
        } else if (existingUser.username === username.toLowerCase()) {
          message = 'Username already taken';
        } else if (existingUser.flowWallet.address === flowAddress) {
          message = 'Flow address already registered';
        }

        return res.status(409).json({
          success: false,
          message: message
        });
      }

      // Create new user
      const user = new User({
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        password,
        flowWallet: {
          address: flowAddress,
          isConnected: true,
          connectedAt: new Date()
        },
        profile: {
          displayName: username
        }
      });

      await user.save();

      // Generate JWT token
      const token = this.generateToken(user.id);

      // Remove password from response
      const userResponse = user.toObject();
      delete userResponse.password;

      logger.info(`New user registered: ${user.username} (${user.email})`);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: userResponse,
          token
        }
      });

    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during registration'
      });
    }
  }

  /**
   * Login user with email/username and password
   */
  login = async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { identifier, password } = req.body; // identifier can be email or username

      // Find user by email or username
      const user = await User.findOne({
        $or: [
          { email: identifier.toLowerCase() },
          { username: identifier.toLowerCase() }
        ]
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Check if account is active
      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Account is deactivated'
        });
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Update last login
      user.lastLoginAt = new Date();
      await user.save();

      // Generate JWT token
      const token = this.generateToken(user.id);

      // Remove password from response
      const userResponse = user.toObject();
      delete userResponse.password;

      logger.info(`User logged in: ${user.username}`);

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: userResponse,
          token
        }
      });

    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during login'
      });
    }
  }

  /**
   * Login/Register with Flow wallet
   */
  flowWalletAuth = async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { flowAddress, signature, message } = req.body;

      // TODO: Verify Flow signature
      // This would require Flow SDK integration for signature verification
      // For now, we'll proceed with address-based authentication

      // Find existing user with this Flow address
      let user = await User.findOne({ 'flowWallet.address': flowAddress });

      if (user) {
        // Existing user - update connection status
        user.flowWallet.isConnected = true;
        user.flowWallet.connectedAt = new Date();
        user.lastLoginAt = new Date();
        await user.save();

        logger.info(`Flow wallet login: ${user.username} (${flowAddress})`);
      } else {
        // New user - create account
        const username = `user_${flowAddress.slice(-8)}`;
        user = new User({
          username,
          flowWallet: {
            address: flowAddress,
            isConnected: true,
            connectedAt: new Date()
          },
          profile: {
            displayName: username
          },
          authMethod: 'wallet'
        });

        await user.save();
        logger.info(`New Flow wallet user: ${username} (${flowAddress})`);
      }

      // Generate JWT token
      const token = this.generateToken(user.id);

      // Remove password from response
      const userResponse = user.toObject();
      delete userResponse.password;

      res.json({
        success: true,
        message: user.isNew ? 'Account created successfully' : 'Login successful',
        data: {
          user: userResponse,
          token,
          isNewUser: !user.email // Consider user new if no email set
        }
      });

    } catch (error) {
      logger.error('Flow wallet auth error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during wallet authentication'
      });
    }
  }

  /**
   * Get current user profile
   */
  getProfile = async (req, res) => {
    try {
      // req.user is already set by auth middleware and password is already removed
      if (!req.user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: { user: req.user }
      });

    } catch (error) {
      logger.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Update user profile
   */
  updateProfile = async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const updates = req.body;

      // Remove sensitive fields that shouldn't be updated via this endpoint
      delete updates.password;
      delete updates.role;
      delete updates.permissions;
      delete updates.isActive;

      // Find the user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Update user properties
      Object.keys(updates).forEach(key => {
        if (key === 'profile') {
          // Merge profile updates
          user.profile = { ...user.profile, ...updates.profile };
        } else if (key === 'preferences') {
          // Merge preferences updates
          user.preferences = { ...user.preferences, ...updates.preferences };
        } else {
          user[key] = updates[key];
        }
      });

      // Save the updated user
      await user.save();

      logger.info(`Profile updated: ${user.username}`);

      // Return user without password
      const userObj = user.toObject();
      delete userObj.password;

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: { user: userObj }
      });

    } catch (error) {
      logger.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Change user password
   */
  changePassword = async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Update password
      user.password = newPassword;
      await user.save();

      logger.info(`Password changed: ${user.username}`);

      res.json({
        success: true,
        message: 'Password changed successfully'
      });

    } catch (error) {
      logger.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Logout user (invalidate token on client side)
   */
  logout = async (req, res) => {
    try {
      // In a more sophisticated setup, you might maintain a blacklist of tokens
      // For now, we'll just return success and let the client handle token removal
      
      logger.info(`User logged out: ${req.user.id}`);

      res.json({
        success: true,
        message: 'Logged out successfully'
      });

    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Refresh JWT token
   */
  refreshToken = async (req, res) => {
    try {
      const userId = req.user.id;
      
      // Generate new token
      const token = this.generateToken(userId);

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: { token }
      });

    } catch (error) {
      logger.error('Refresh token error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Generate JWT token
   */
  generateToken(userId) {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  }

  /**
   * Verify JWT token
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}

export default new AuthController();