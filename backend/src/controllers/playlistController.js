/**
 * Playlist Controller
 * Handles playlist-related operations
 */

import Playlist from '../models/Playlist.js';
import MusicNFT from '../models/MusicNFT.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';
import { validationResult } from 'express-validator';

class PlaylistController {
  /**
   * Create a new playlist
   */
  static async createPlaylist(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const {
        name,
        description,
        visibility = 'public',
        category = 'user',
        tags = [],
        cover,
        isCollaborative = false
      } = req.body;

      const playlist = new Playlist({
        name,
        description,
        owner: req.user.id,
        visibility,
        category,
        tags,
        cover,
        isCollaborative
      });

      await playlist.save();

      logger.info(`Playlist created: ${name} by user ${req.user.id}`);

      res.status(201).json({
        success: true,
        message: 'Playlist created successfully',
        data: playlist.getPublicData()
      });
    } catch (error) {
      logger.error('Error creating playlist:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create playlist',
        error: error.message
      });
    }
  }

  /**
   * Get playlist by ID
   */
  static async getPlaylist(req, res) {
    try {
      const { id } = req.params;
      const playlist = await Playlist.findById(id);

      if (!playlist) {
        return res.status(404).json({
          success: false,
          message: 'Playlist not found'
        });
      }

      // Check access permissions
      if (!playlist.hasAccess(req.user?.id)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Get track details
      const tracksWithDetails = await Promise.all(
        playlist.tracks.map(async (track) => {
          const musicNFT = await MusicNFT.findById(track.id);
          return {
            ...track,
            musicNFT: musicNFT ? musicNFT.getPublicData() : null
          };
        })
      );

      const playlistData = playlist.getPublicData();
      playlistData.tracks = tracksWithDetails;

      res.json({
        success: true,
        data: playlistData
      });
    } catch (error) {
      logger.error('Error getting playlist:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get playlist',
        error: error.message
      });
    }
  }

  /**
   * Update playlist
   */
  static async updatePlaylist(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const playlist = await Playlist.findById(id);

      if (!playlist) {
        return res.status(404).json({
          success: false,
          message: 'Playlist not found'
        });
      }

      // Check permissions
      if (!playlist.hasPermission(req.user.id, 'edit')) {
        return res.status(403).json({
          success: false,
          message: 'Permission denied'
        });
      }

      const {
        name,
        description,
        visibility,
        tags,
        cover,
        isCollaborative
      } = req.body;

      // Update fields
      if (name !== undefined) playlist.name = name;
      if (description !== undefined) playlist.description = description;
      if (visibility !== undefined) playlist.visibility = visibility;
      if (tags !== undefined) playlist.tags = tags;
      if (cover !== undefined) playlist.cover = cover;
      if (isCollaborative !== undefined) playlist.isCollaborative = isCollaborative;

      await playlist.save();

      logger.info(`Playlist updated: ${playlist.name} (${id})`);

      res.json({
        success: true,
        message: 'Playlist updated successfully',
        data: playlist.getPublicData()
      });
    } catch (error) {
      logger.error('Error updating playlist:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update playlist',
        error: error.message
      });
    }
  }

  /**
   * Delete playlist
   */
  static async deletePlaylist(req, res) {
    try {
      const { id } = req.params;
      const playlist = await Playlist.findById(id);

      if (!playlist) {
        return res.status(404).json({
          success: false,
          message: 'Playlist not found'
        });
      }

      // Check permissions (only owner can delete)
      if (playlist.owner !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Only the owner can delete this playlist'
        });
      }

      await Playlist.deleteById(id);

      logger.info(`Playlist deleted: ${playlist.name} (${id})`);

      res.json({
        success: true,
        message: 'Playlist deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting playlist:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete playlist',
        error: error.message
      });
    }
  }

  /**
   * Add track to playlist
   */
  static async addTrack(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const { trackId, position } = req.body;

      const playlist = await Playlist.findById(id);
      if (!playlist) {
        return res.status(404).json({
          success: false,
          message: 'Playlist not found'
        });
      }

      // Check permissions
      if (!playlist.hasPermission(req.user.id, 'add')) {
        return res.status(403).json({
          success: false,
          message: 'Permission denied'
        });
      }

      // Verify track exists
      const track = await MusicNFT.findById(trackId);
      if (!track) {
        return res.status(404).json({
          success: false,
          message: 'Track not found'
        });
      }

      // Check if track is already in playlist
      const existingTrack = playlist.tracks.find(t => t.id === trackId);
      if (existingTrack) {
        return res.status(400).json({
          success: false,
          message: 'Track already in playlist'
        });
      }

      playlist.addTrack(trackId, position);
      await playlist.save();

      logger.info(`Track ${trackId} added to playlist ${id}`);

      res.json({
        success: true,
        message: 'Track added to playlist successfully',
        data: playlist.getPublicData()
      });
    } catch (error) {
      logger.error('Error adding track to playlist:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add track to playlist',
        error: error.message
      });
    }
  }

  /**
   * Remove track from playlist
   */
  static async removeTrack(req, res) {
    try {
      const { id, trackId } = req.params;

      const playlist = await Playlist.findById(id);
      if (!playlist) {
        return res.status(404).json({
          success: false,
          message: 'Playlist not found'
        });
      }

      // Check permissions
      if (!playlist.hasPermission(req.user.id, 'remove')) {
        return res.status(403).json({
          success: false,
          message: 'Permission denied'
        });
      }

      const removed = playlist.removeTrack(trackId);
      if (!removed) {
        return res.status(404).json({
          success: false,
          message: 'Track not found in playlist'
        });
      }

      await playlist.save();

      logger.info(`Track ${trackId} removed from playlist ${id}`);

      res.json({
        success: true,
        message: 'Track removed from playlist successfully',
        data: playlist.getPublicData()
      });
    } catch (error) {
      logger.error('Error removing track from playlist:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove track from playlist',
        error: error.message
      });
    }
  }

  /**
   * Reorder tracks in playlist
   */
  static async reorderTracks(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const { trackId, newPosition } = req.body;

      const playlist = await Playlist.findById(id);
      if (!playlist) {
        return res.status(404).json({
          success: false,
          message: 'Playlist not found'
        });
      }

      // Check permissions
      if (!playlist.hasPermission(req.user.id, 'edit')) {
        return res.status(403).json({
          success: false,
          message: 'Permission denied'
        });
      }

      const reordered = playlist.reorderTracks(trackId, newPosition);
      if (!reordered) {
        return res.status(400).json({
          success: false,
          message: 'Invalid track or position'
        });
      }

      await playlist.save();

      logger.info(`Tracks reordered in playlist ${id}`);

      res.json({
        success: true,
        message: 'Tracks reordered successfully',
        data: playlist.getPublicData()
      });
    } catch (error) {
      logger.error('Error reordering tracks:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reorder tracks',
        error: error.message
      });
    }
  }

  /**
   * Get user's playlists
   */
  static async getUserPlaylists(req, res) {
    try {
      const { userId } = req.params;
      const { limit = 20, offset = 0 } = req.query;

      // Check if requesting own playlists or public playlists
      const isOwnPlaylists = req.user?.id === userId;

      let playlists;
      if (isOwnPlaylists) {
        playlists = await Playlist.findByOwner(userId, parseInt(limit), parseInt(offset));
      } else {
        // Only return public playlists for other users
        const allPlaylists = await Playlist.findByOwner(userId, parseInt(limit), parseInt(offset));
        playlists = allPlaylists.filter(playlist => playlist.visibility === 'public');
      }

      res.json({
        success: true,
        data: playlists.map(playlist => playlist.getPublicData()),
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: playlists.length
        }
      });
    } catch (error) {
      logger.error('Error getting user playlists:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user playlists',
        error: error.message
      });
    }
  }

  /**
   * Get current user's playlists
   */
  static async getCurrentUserPlaylists(req, res) {
    try {
      const { limit = 20, offset = 0 } = req.query;
      const userId = req.user.id;

      const playlists = await Playlist.findByOwner(userId, parseInt(limit), parseInt(offset));

      res.json({
        success: true,
        data: playlists.map(playlist => playlist.getPublicData()),
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: playlists.length
        }
      });
    } catch (error) {
      logger.error('Error getting current user playlists:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get current user playlists',
        error: error.message
      });
    }
  }

  /**
   * Get public playlists
   */
  static async getPublicPlaylists(req, res) {
    try {
      const { limit = 20, offset = 0, category, sort = 'recent' } = req.query;

      let playlists;
      if (category) {
        playlists = await Playlist.findByCategory(category, parseInt(limit), parseInt(offset));
      } else {
        playlists = await Playlist.findPublic(parseInt(limit), parseInt(offset));
      }

      // Sort playlists
      if (sort === 'popular') {
        playlists.sort((a, b) => b.analytics.plays - a.analytics.plays);
      } else if (sort === 'liked') {
        playlists.sort((a, b) => b.analytics.likes - a.analytics.likes);
      } else {
        playlists.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }

      res.json({
        success: true,
        data: playlists.map(playlist => playlist.getPublicData()),
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: playlists.length
        }
      });
    } catch (error) {
      logger.error('Error getting public playlists:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get public playlists',
        error: error.message
      });
    }
  }

  /**
   * Get featured playlists
   */
  static async getFeaturedPlaylists(req, res) {
    try {
      const { limit = 10 } = req.query;
      const playlists = await Playlist.findFeatured(parseInt(limit));

      res.json({
        success: true,
        data: playlists.map(playlist => playlist.getPublicData())
      });
    } catch (error) {
      logger.error('Error getting featured playlists:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get featured playlists',
        error: error.message
      });
    }
  }

  /**
   * Get trending playlists
   */
  static async getTrendingPlaylists(req, res) {
    try {
      const { limit = 20 } = req.query;
      const playlists = await Playlist.getTrending(parseInt(limit));

      res.json({
        success: true,
        data: playlists.map(playlist => playlist.getPublicData())
      });
    } catch (error) {
      logger.error('Error getting trending playlists:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get trending playlists',
        error: error.message
      });
    }
  }

  /**
   * Search playlists
   */
  static async searchPlaylists(req, res) {
    try {
      const { q: query, limit = 20 } = req.query;

      if (!query) {
        return res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
      }

      const playlists = await Playlist.search(query, parseInt(limit));

      res.json({
        success: true,
        data: playlists.map(playlist => playlist.getPublicData()),
        query
      });
    } catch (error) {
      logger.error('Error searching playlists:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search playlists',
        error: error.message
      });
    }
  }

  /**
   * Play playlist (increment play count)
   */
  static async playPlaylist(req, res) {
    try {
      const { id } = req.params;
      const playlist = await Playlist.findById(id);

      if (!playlist) {
        return res.status(404).json({
          success: false,
          message: 'Playlist not found'
        });
      }

      // Check access permissions
      if (!playlist.hasAccess(req.user?.id)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      await playlist.incrementPlays(req.user?.id);

      res.json({
        success: true,
        message: 'Play count updated',
        data: {
          plays: playlist.analytics.plays
        }
      });
    } catch (error) {
      logger.error('Error playing playlist:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update play count',
        error: error.message
      });
    }
  }

  /**
   * Like/unlike playlist
   */
  static async toggleLike(req, res) {
    try {
      const { id } = req.params;
      const playlist = await Playlist.findById(id);

      if (!playlist) {
        return res.status(404).json({
          success: false,
          message: 'Playlist not found'
        });
      }

      // Check access permissions
      if (!playlist.hasAccess(req.user.id)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const isLiked = await playlist.toggleLike(req.user.id);

      res.json({
        success: true,
        message: isLiked ? 'Playlist liked' : 'Playlist unliked',
        data: {
          isLiked,
          likes: playlist.analytics.likes
        }
      });
    } catch (error) {
      logger.error('Error toggling playlist like:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to toggle like',
        error: error.message
      });
    }
  }

  /**
   * Follow/unfollow playlist
   */
  static async toggleFollow(req, res) {
    try {
      const { id } = req.params;
      const playlist = await Playlist.findById(id);

      if (!playlist) {
        return res.status(404).json({
          success: false,
          message: 'Playlist not found'
        });
      }

      // Check access permissions
      if (!playlist.hasAccess(req.user.id)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const isFollowing = await playlist.toggleFollow(req.user.id);

      res.json({
        success: true,
        message: isFollowing ? 'Playlist followed' : 'Playlist unfollowed',
        data: {
          isFollowing,
          followers: playlist.analytics.followers
        }
      });
    } catch (error) {
      logger.error('Error toggling playlist follow:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to toggle follow',
        error: error.message
      });
    }
  }

  /**
   * Add collaborator to playlist
   */
  static async addCollaborator(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const { userId, permissions = ['add', 'remove'] } = req.body;

      const playlist = await Playlist.findById(id);
      if (!playlist) {
        return res.status(404).json({
          success: false,
          message: 'Playlist not found'
        });
      }

      // Only owner can add collaborators
      if (playlist.owner !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Only the owner can add collaborators'
        });
      }

      // Verify user exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      playlist.addCollaborator(userId, permissions);
      await playlist.save();

      logger.info(`Collaborator ${userId} added to playlist ${id}`);

      res.json({
        success: true,
        message: 'Collaborator added successfully',
        data: playlist.getPublicData()
      });
    } catch (error) {
      logger.error('Error adding collaborator:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add collaborator',
        error: error.message
      });
    }
  }

  /**
   * Remove collaborator from playlist
   */
  static async removeCollaborator(req, res) {
    try {
      const { id, userId } = req.params;

      const playlist = await Playlist.findById(id);
      if (!playlist) {
        return res.status(404).json({
          success: false,
          message: 'Playlist not found'
        });
      }

      // Only owner can remove collaborators
      if (playlist.owner !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Only the owner can remove collaborators'
        });
      }

      playlist.removeCollaborator(userId);
      await playlist.save();

      logger.info(`Collaborator ${userId} removed from playlist ${id}`);

      res.json({
        success: true,
        message: 'Collaborator removed successfully',
        data: playlist.getPublicData()
      });
    } catch (error) {
      logger.error('Error removing collaborator:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove collaborator',
        error: error.message
      });
    }
  }

  /**
   * Get playlist statistics
   */
  static async getPlaylistStats(req, res) {
    try {
      const stats = await Playlist.getStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error getting playlist stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get playlist statistics',
        error: error.message
      });
    }
  }
}

export default PlaylistController;