/**
 * User Model for Redis-based storage
 * Simplified user management without Mongoose
 */

import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import Database from '../config/database.js';
import logger from '../utils/logger.js';

class User {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.username = data.username || '';
    this.email = data.email || '';
    this.password = data.password || '';
    this.flowWallet = data.flowWallet || {
      address: '',
      isConnected: false,
      connectedAt: null
    };
    this.profile = data.profile || {
      displayName: '',
      bio: '',
      avatar: '',
      website: '',
      twitter: '',
      instagram: ''
    };
    this.role = data.role || 'user';
    this.permissions = data.permissions || [];
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.authMethod = data.authMethod || 'email';
    this.preferences = data.preferences || {
      emailNotifications: true,
      pushNotifications: true,
      theme: 'dark',
      language: 'en'
    };
    this.stats = data.stats || {
      nftsCreated: 0,
      nftsOwned: 0,
      totalEarnings: '0',
      totalSpent: '0',
      playlistsCreated: 0,
      followersCount: 0,
      followingCount: 0
    };
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.lastLoginAt = data.lastLoginAt || null;
  }

  /**
   * Hash password before saving
   */
  async hashPassword() {
    if (this.password && !this.password.startsWith('$2')) {
      const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      this.password = await bcrypt.hash(this.password, rounds);
    }
  }

  /**
   * Compare password
   */
  async comparePassword(candidatePassword) {
    if (!this.password) return false;
    return await bcrypt.compare(candidatePassword, this.password);
  }

  /**
   * Check if user has permission
   */
  hasPermission(permission) {
    if (this.role === 'super_admin') return true;
    if (this.role === 'admin' && !['super_admin'].includes(permission)) return true;
    return this.permissions.includes(permission);
  }

  /**
   * Add permission
   */
  addPermission(permission) {
    if (!this.permissions.includes(permission)) {
      this.permissions.push(permission);
    }
  }

  /**
   * Remove permission
   */
  removePermission(permission) {
    this.permissions = this.permissions.filter(p => p !== permission);
  }

  /**
   * Get public profile (without sensitive data)
   */
  getPublicProfile() {
    return {
      id: this.id,
      username: this.username,
      profile: this.profile,
      flowWallet: {
        address: this.flowWallet.address,
        isConnected: this.flowWallet.isConnected
      },
      stats: this.stats,
      createdAt: this.createdAt,
      role: this.role
    };
  }

  /**
   * Update stats
   */
  async updateStats(updates) {
    this.stats = { ...this.stats, ...updates };
    this.updatedAt = new Date().toISOString();
    await this.save();
  }

  /**
   * Save user to database
   */
  async save() {
    try {
      await this.hashPassword();
      this.updatedAt = new Date().toISOString();
      
      const userData = this.toObject();
      await Database.set(`user:${this.id}`, userData);
      
      // Index by email and username for quick lookup
      if (this.email) {
        await Database.set(`user:email:${this.email.toLowerCase()}`, this.id);
      }
      if (this.username) {
        await Database.set(`user:username:${this.username.toLowerCase()}`, this.id);
      }
      if (this.flowWallet.address) {
        await Database.set(`user:flow:${this.flowWallet.address}`, this.id);
      }

      // Add to users set
      await Database.sadd('users', this.id);

      logger.info(`User saved: ${this.username} (${this.id})`);
      return this;
    } catch (error) {
      logger.error('Error saving user:', error);
      throw error;
    }
  }

  /**
   * Convert to plain object
   */
  toObject() {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      password: this.password,
      flowWallet: this.flowWallet,
      profile: this.profile,
      role: this.role,
      permissions: this.permissions,
      isActive: this.isActive,
      authMethod: this.authMethod,
      preferences: this.preferences,
      stats: this.stats,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastLoginAt: this.lastLoginAt
    };
  }

  /**
   * Find user by ID
   */
  static async findById(id) {
    try {
      const userData = await Database.get(`user:${id}`);
      return userData ? new User(userData) : null;
    } catch (error) {
      logger.error(`Error finding user by ID ${id}:`, error);
      return null;
    }
  }

  /**
   * Find user by email
   */
  static async findByEmail(email) {
    try {
      const userId = await Database.get(`user:email:${email.toLowerCase()}`);
      return userId ? await User.findById(userId) : null;
    } catch (error) {
      logger.error(`Error finding user by email ${email}:`, error);
      return null;
    }
  }

  /**
   * Find user by username
   */
  static async findByUsername(username) {
    try {
      const userId = await Database.get(`user:username:${username.toLowerCase()}`);
      return userId ? await User.findById(userId) : null;
    } catch (error) {
      logger.error(`Error finding user by username ${username}:`, error);
      return null;
    }
  }

  /**
   * Find user by Flow address
   */
  static async findByFlowAddress(address) {
    try {
      const userId = await Database.get(`user:flow:${address}`);
      return userId ? await User.findById(userId) : null;
    } catch (error) {
      logger.error(`Error finding user by Flow address ${address}:`, error);
      return null;
    }
  }

  /**
   * Find user by email or username
   */
  static async findOne(query) {
    try {
      if (query.email) {
        return await User.findByEmail(query.email);
      }
      if (query.username) {
        return await User.findByUsername(query.username);
      }
      if (query['flowWallet.address']) {
        return await User.findByFlowAddress(query['flowWallet.address']);
      }
      if (query.$or) {
        for (const condition of query.$or) {
          if (condition.email) {
            const user = await User.findByEmail(condition.email);
            if (user) return user;
          }
          if (condition.username) {
            const user = await User.findByUsername(condition.username);
            if (user) return user;
          }
          if (condition['flowWallet.address']) {
            const user = await User.findByFlowAddress(condition['flowWallet.address']);
            if (user) return user;
          }
        }
      }
      return null;
    } catch (error) {
      logger.error('Error in findOne:', error);
      return null;
    }
  }

  /**
   * Get all users
   */
  static async findAll(limit = 50, offset = 0) {
    try {
      const userIds = await Database.smembers('users');
      const paginatedIds = userIds.slice(offset, offset + limit);
      
      const users = await Promise.all(
        paginatedIds.map(id => User.findById(id))
      );
      
      return users.filter(user => user !== null);
    } catch (error) {
      logger.error('Error finding all users:', error);
      return [];
    }
  }

  /**
   * Get user statistics
   */
  static async getStats() {
    try {
      const userIds = await Database.smembers('users');
      const totalUsers = userIds.length;
      
      const users = await Promise.all(
        userIds.map(id => User.findById(id))
      );
      
      const activeUsers = users.filter(user => user && user.isActive).length;
      const walletUsers = users.filter(user => user && user.flowWallet.isConnected).length;
      
      return {
        totalUsers,
        activeUsers,
        walletUsers,
        inactiveUsers: totalUsers - activeUsers
      };
    } catch (error) {
      logger.error('Error getting user stats:', error);
      return {
        totalUsers: 0,
        activeUsers: 0,
        walletUsers: 0,
        inactiveUsers: 0
      };
    }
  }

  /**
   * Delete user
   */
  static async deleteById(id) {
    try {
      const user = await User.findById(id);
      if (!user) return false;

      // Remove from indexes
      if (user.email) {
        await Database.del(`user:email:${user.email.toLowerCase()}`);
      }
      if (user.username) {
        await Database.del(`user:username:${user.username.toLowerCase()}`);
      }
      if (user.flowWallet.address) {
        await Database.del(`user:flow:${user.flowWallet.address}`);
      }

      // Remove from users set
      await Database.sadd('users', id); // Remove from set
      
      // Delete user data
      await Database.del(`user:${id}`);

      logger.info(`User deleted: ${user.username} (${id})`);
      return true;
    } catch (error) {
      logger.error(`Error deleting user ${id}:`, error);
      return false;
    }
  }

  /**
   * Search users
   */
  static async search(query, limit = 20) {
    try {
      const userIds = await Database.smembers('users');
      const users = await Promise.all(
        userIds.map(id => User.findById(id))
      );
      
      const searchTerm = query.toLowerCase();
      const filteredUsers = users.filter(user => {
        if (!user) return false;
        return (
          user.username.toLowerCase().includes(searchTerm) ||
          user.email.toLowerCase().includes(searchTerm) ||
          user.profile.displayName.toLowerCase().includes(searchTerm)
        );
      });
      
      return filteredUsers.slice(0, limit);
    } catch (error) {
      logger.error('Error searching users:', error);
      return [];
    }
  }
}

export default User;