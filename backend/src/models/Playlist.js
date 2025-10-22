/**
 * Playlist Model for Redis-based storage
 * Simplified playlist management without Mongoose
 */

import { v4 as uuidv4 } from 'uuid';
import Database from '../config/database.js';
import logger from '../utils/logger.js';

class Playlist {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.name = data.name || '';
    this.description = data.description || '';
    this.owner = data.owner || '';
    this.collaborators = data.collaborators || [];
    
    // Tracks
    this.tracks = data.tracks || [];
    this.trackCount = data.trackCount || 0;
    this.totalDuration = data.totalDuration || 0;
    
    // Metadata
    this.cover = data.cover || {
      url: '',
      ipfsHash: ''
    };
    this.category = data.category || 'user'; // 'user', 'ai-generated', 'curated', 'system'
    this.tags = data.tags || [];
    this.mood = data.mood || '';
    this.genre = data.genre || '';
    
    // Visibility and permissions
    this.visibility = data.visibility || 'public'; // 'public', 'private', 'unlisted'
    this.isCollaborative = data.isCollaborative || false;
    this.allowComments = data.allowComments !== undefined ? data.allowComments : true;
    
    // Analytics
    this.analytics = data.analytics || {
      views: 0,
      plays: 0,
      likes: 0,
      shares: 0,
      followers: 0,
      totalPlayTime: 0,
      uniqueListeners: 0
    };
    
    // AI generation data (if AI-generated)
    this.aiGeneration = data.aiGeneration || {
      isAIGenerated: false,
      prompt: '',
      model: '',
      parameters: {},
      generatedAt: null
    };
    
    // Status
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.isFeatured = data.isFeatured || false;
    this.isSystem = data.isSystem || false;
    
    // Timestamps
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.lastPlayedAt = data.lastPlayedAt || null;
  }

  /**
   * Add track to playlist
   */
  addTrack(trackId, position = null) {
    const track = {
      id: trackId,
      addedAt: new Date().toISOString(),
      addedBy: this.owner,
      position: position !== null ? position : this.tracks.length
    };

    if (position !== null && position < this.tracks.length) {
      this.tracks.splice(position, 0, track);
      // Update positions for subsequent tracks
      for (let i = position + 1; i < this.tracks.length; i++) {
        this.tracks[i].position = i;
      }
    } else {
      this.tracks.push(track);
    }

    this.trackCount = this.tracks.length;
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Remove track from playlist
   */
  removeTrack(trackId) {
    const index = this.tracks.findIndex(track => track.id === trackId);
    if (index !== -1) {
      this.tracks.splice(index, 1);
      // Update positions for subsequent tracks
      for (let i = index; i < this.tracks.length; i++) {
        this.tracks[i].position = i;
      }
      this.trackCount = this.tracks.length;
      this.updatedAt = new Date().toISOString();
      return true;
    }
    return false;
  }

  /**
   * Reorder tracks
   */
  reorderTracks(trackId, newPosition) {
    const currentIndex = this.tracks.findIndex(track => track.id === trackId);
    if (currentIndex === -1 || newPosition < 0 || newPosition >= this.tracks.length) {
      return false;
    }

    const track = this.tracks.splice(currentIndex, 1)[0];
    this.tracks.splice(newPosition, 0, track);

    // Update all positions
    this.tracks.forEach((track, index) => {
      track.position = index;
    });

    this.updatedAt = new Date().toISOString();
    return true;
  }

  /**
   * Add collaborator
   */
  addCollaborator(userId, permissions = ['add', 'remove']) {
    const existing = this.collaborators.find(c => c.userId === userId);
    if (!existing) {
      this.collaborators.push({
        userId,
        permissions,
        addedAt: new Date().toISOString()
      });
      this.updatedAt = new Date().toISOString();
    }
  }

  /**
   * Remove collaborator
   */
  removeCollaborator(userId) {
    this.collaborators = this.collaborators.filter(c => c.userId !== userId);
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Check if user has permission
   */
  hasPermission(userId, action) {
    if (this.owner === userId) return true;
    
    const collaborator = this.collaborators.find(c => c.userId === userId);
    return collaborator && collaborator.permissions.includes(action);
  }

  /**
   * Update total duration
   */
  async updateTotalDuration() {
    // This would typically fetch track durations from the database
    // For now, we'll just update the timestamp
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Increment play count
   */
  async incrementPlays(userId = null) {
    this.analytics.plays += 1;
    this.lastPlayedAt = new Date().toISOString();
    
    if (userId) {
      // Track unique listeners
      const listenerKey = `playlist:${this.id}:listeners`;
      const isNewListener = await Database.sadd(listenerKey, userId);
      if (isNewListener) {
        this.analytics.uniqueListeners += 1;
      }
    }
    
    await this.save();
  }

  /**
   * Toggle like
   */
  async toggleLike(userId) {
    const likeKey = `playlist:${this.id}:likes`;
    const isLiked = await Database.sismember(likeKey, userId);
    
    if (isLiked) {
      await Database.srem(likeKey, userId);
      this.analytics.likes = Math.max(0, this.analytics.likes - 1);
    } else {
      await Database.sadd(likeKey, userId);
      this.analytics.likes += 1;
    }
    
    await this.save();
    return !isLiked;
  }

  /**
   * Toggle follow
   */
  async toggleFollow(userId) {
    const followKey = `playlist:${this.id}:followers`;
    const isFollowing = await Database.sismember(followKey, userId);
    
    if (isFollowing) {
      await Database.srem(followKey, userId);
      this.analytics.followers = Math.max(0, this.analytics.followers - 1);
    } else {
      await Database.sadd(followKey, userId);
      this.analytics.followers += 1;
    }
    
    await this.save();
    return !isFollowing;
  }

  /**
   * Check if user has access
   */
  hasAccess(userId) {
    if (this.visibility === 'public') return true;
    if (this.visibility === 'private') {
      return this.owner === userId || this.collaborators.some(c => c.userId === userId);
    }
    return false;
  }

  /**
   * Get public data
   */
  getPublicData() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      owner: this.owner,
      cover: this.cover,
      category: this.category,
      tags: this.tags,
      mood: this.mood,
      genre: this.genre,
      trackCount: this.trackCount,
      totalDuration: this.totalDuration,
      visibility: this.visibility,
      isCollaborative: this.isCollaborative,
      analytics: this.analytics,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastPlayedAt: this.lastPlayedAt
    };
  }

  /**
   * Save playlist to database
   */
  async save() {
    try {
      this.updatedAt = new Date().toISOString();
      
      const playlistData = this.toObject();
      await Database.set(`playlist:${this.id}`, playlistData);
      
      // Index by owner
      await Database.sadd(`user:${this.owner}:playlists`, this.id);
      
      // Index by category and tags
      await Database.sadd(`playlists:category:${this.category}`, this.id);
      for (const tag of this.tags) {
        await Database.sadd(`playlists:tag:${tag}`, this.id);
      }
      
      // Index by visibility
      await Database.sadd(`playlists:visibility:${this.visibility}`, this.id);
      
      // Add to main playlists set
      await Database.sadd('playlists', this.id);
      
      // Featured playlists
      if (this.isFeatured) {
        await Database.sadd('playlists:featured', this.id);
      }

      logger.info(`Playlist saved: ${this.name} (${this.id})`);
      return this;
    } catch (error) {
      logger.error('Error saving playlist:', error);
      throw error;
    }
  }

  /**
   * Convert to plain object
   */
  toObject() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      owner: this.owner,
      collaborators: this.collaborators,
      tracks: this.tracks,
      trackCount: this.trackCount,
      totalDuration: this.totalDuration,
      cover: this.cover,
      category: this.category,
      tags: this.tags,
      mood: this.mood,
      genre: this.genre,
      visibility: this.visibility,
      isCollaborative: this.isCollaborative,
      allowComments: this.allowComments,
      analytics: this.analytics,
      aiGeneration: this.aiGeneration,
      isActive: this.isActive,
      isFeatured: this.isFeatured,
      isSystem: this.isSystem,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastPlayedAt: this.lastPlayedAt
    };
  }

  /**
   * Find playlist by ID
   */
  static async findById(id) {
    try {
      const playlistData = await Database.get(`playlist:${id}`);
      return playlistData ? new Playlist(playlistData) : null;
    } catch (error) {
      logger.error(`Error finding playlist by ID ${id}:`, error);
      return null;
    }
  }

  /**
   * Find playlists by owner
   */
  static async findByOwner(ownerId, limit = 20, offset = 0) {
    try {
      const playlistIds = await Database.smembers(`user:${ownerId}:playlists`);
      const paginatedIds = playlistIds.slice(offset, offset + limit);
      
      const playlists = await Promise.all(
        paginatedIds.map(id => Playlist.findById(id))
      );
      
      return playlists.filter(playlist => playlist !== null);
    } catch (error) {
      logger.error(`Error finding playlists by owner ${ownerId}:`, error);
      return [];
    }
  }

  /**
   * Find public playlists
   */
  static async findPublic(limit = 20, offset = 0) {
    try {
      const playlistIds = await Database.smembers('playlists:visibility:public');
      const paginatedIds = playlistIds.slice(offset, offset + limit);
      
      const playlists = await Promise.all(
        paginatedIds.map(id => Playlist.findById(id))
      );
      
      return playlists.filter(playlist => playlist !== null && playlist.isActive);
    } catch (error) {
      logger.error('Error finding public playlists:', error);
      return [];
    }
  }

  /**
   * Find featured playlists
   */
  static async findFeatured(limit = 10) {
    try {
      const playlistIds = await Database.smembers('playlists:featured');
      const limitedIds = playlistIds.slice(0, limit);
      
      const playlists = await Promise.all(
        limitedIds.map(id => Playlist.findById(id))
      );
      
      return playlists.filter(playlist => playlist !== null && playlist.isActive);
    } catch (error) {
      logger.error('Error finding featured playlists:', error);
      return [];
    }
  }

  /**
   * Find playlists by category
   */
  static async findByCategory(category, limit = 20, offset = 0) {
    try {
      const playlistIds = await Database.smembers(`playlists:category:${category}`);
      const paginatedIds = playlistIds.slice(offset, offset + limit);
      
      const playlists = await Promise.all(
        paginatedIds.map(id => Playlist.findById(id))
      );
      
      return playlists.filter(playlist => playlist !== null && playlist.isActive);
    } catch (error) {
      logger.error(`Error finding playlists by category ${category}:`, error);
      return [];
    }
  }

  /**
   * Search playlists
   */
  static async search(query, limit = 20) {
    try {
      const playlistIds = await Database.smembers('playlists');
      const playlists = await Promise.all(
        playlistIds.map(id => Playlist.findById(id))
      );
      
      const searchTerm = query.toLowerCase();
      const filteredPlaylists = playlists.filter(playlist => {
        if (!playlist || !playlist.isActive) return false;
        return (
          playlist.name.toLowerCase().includes(searchTerm) ||
          playlist.description.toLowerCase().includes(searchTerm) ||
          playlist.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
      });
      
      return filteredPlaylists.slice(0, limit);
    } catch (error) {
      logger.error('Error searching playlists:', error);
      return [];
    }
  }

  /**
   * Get trending playlists (by plays)
   */
  static async getTrending(limit = 20) {
    try {
      const playlistIds = await Database.smembers('playlists:visibility:public');
      const playlists = await Promise.all(
        playlistIds.map(id => Playlist.findById(id))
      );
      
      const activePlaylists = playlists.filter(playlist => playlist && playlist.isActive);
      
      // Sort by plays (descending)
      activePlaylists.sort((a, b) => b.analytics.plays - a.analytics.plays);
      
      return activePlaylists.slice(0, limit);
    } catch (error) {
      logger.error('Error getting trending playlists:', error);
      return [];
    }
  }

  /**
   * Find user accessible playlists
   */
  static async findUserAccessible(userId, limit = 50, offset = 0) {
    try {
      const allPlaylistIds = await Database.smembers('playlists');
      const playlists = await Promise.all(
        allPlaylistIds.map(id => Playlist.findById(id))
      );
      
      const accessiblePlaylists = playlists.filter(playlist => {
        if (!playlist || !playlist.isActive) return false;
        return playlist.hasAccess(userId);
      });
      
      return accessiblePlaylists.slice(offset, offset + limit);
    } catch (error) {
      logger.error(`Error finding user accessible playlists for ${userId}:`, error);
      return [];
    }
  }

  /**
   * Create system playlist
   */
  static async createSystemPlaylist(name, description, tracks = []) {
    try {
      const playlist = new Playlist({
        name,
        description,
        owner: 'system',
        tracks: tracks.map((trackId, index) => ({
          id: trackId,
          addedAt: new Date().toISOString(),
          addedBy: 'system',
          position: index
        })),
        trackCount: tracks.length,
        category: 'system',
        visibility: 'public',
        isSystem: true,
        isActive: true
      });
      
      await playlist.save();
      return playlist;
    } catch (error) {
      logger.error('Error creating system playlist:', error);
      throw error;
    }
  }

  /**
   * Get playlist statistics
   */
  static async getStats() {
    try {
      const playlistIds = await Database.smembers('playlists');
      const playlists = await Promise.all(
        playlistIds.map(id => Playlist.findById(id))
      );
      
      const activePlaylists = playlists.filter(playlist => playlist && playlist.isActive);
      const totalPlays = activePlaylists.reduce((sum, playlist) => sum + playlist.analytics.plays, 0);
      const totalLikes = activePlaylists.reduce((sum, playlist) => sum + playlist.analytics.likes, 0);
      const totalTracks = activePlaylists.reduce((sum, playlist) => sum + playlist.trackCount, 0);
      
      return {
        totalPlaylists: activePlaylists.length,
        totalPlays,
        totalLikes,
        totalTracks,
        categories: await this.getCategoryStats()
      };
    } catch (error) {
      logger.error('Error getting playlist stats:', error);
      return {
        totalPlaylists: 0,
        totalPlays: 0,
        totalLikes: 0,
        totalTracks: 0,
        categories: {}
      };
    }
  }

  /**
   * Get category statistics
   */
  static async getCategoryStats() {
    try {
      const categories = ['user', 'ai-generated', 'curated', 'system'];
      const stats = {};
      
      for (const category of categories) {
        const playlistIds = await Database.smembers(`playlists:category:${category}`);
        stats[category] = playlistIds.length;
      }
      
      return stats;
    } catch (error) {
      logger.error('Error getting category stats:', error);
      return {};
    }
  }

  /**
   * Delete playlist
   */
  static async deleteById(id) {
    try {
      const playlist = await Playlist.findById(id);
      if (!playlist) return false;

      // Remove from indexes
      await Database.srem(`user:${playlist.owner}:playlists`, id);
      await Database.srem(`playlists:category:${playlist.category}`, id);
      await Database.srem(`playlists:visibility:${playlist.visibility}`, id);
      await Database.srem('playlists:featured', id);
      
      for (const tag of playlist.tags) {
        await Database.srem(`playlists:tag:${tag}`, id);
      }
      
      // Remove from main set
      await Database.srem('playlists', id);
      
      // Delete playlist data
      await Database.del(`playlist:${id}`);
      
      // Clean up related data
      await Database.del(`playlist:${id}:likes`);
      await Database.del(`playlist:${id}:followers`);
      await Database.del(`playlist:${id}:listeners`);

      logger.info(`Playlist deleted: ${playlist.name} (${id})`);
      return true;
    } catch (error) {
      logger.error(`Error deleting playlist ${id}:`, error);
      return false;
    }
  }
}

export default Playlist;