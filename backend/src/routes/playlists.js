/**
 * Playlist Routes
 * Defines all playlist-related API endpoints
 */

import express from 'express';
import { body, param, query } from 'express-validator';
import PlaylistController from '../controllers/playlistController.js';
import { authenticateToken, optionalAuth, requireOwnershipOrAdmin } from '../middleware/auth.js';
import { rateLimiter, playlistLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Validation rules
const createPlaylistValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Playlist name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('visibility')
    .optional()
    .isIn(['public', 'private', 'unlisted'])
    .withMessage('Visibility must be public, private, or unlisted'),
  body('category')
    .optional()
    .isIn(['user', 'ai-generated', 'curated', 'system'])
    .withMessage('Invalid category'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('Each tag must be between 1 and 30 characters'),
  body('cover.url')
    .optional()
    .isURL()
    .withMessage('Cover URL must be a valid URL'),
  body('cover.ipfsHash')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('IPFS hash cannot be empty'),
  body('isCollaborative')
    .optional()
    .isBoolean()
    .withMessage('isCollaborative must be a boolean')
];

const updatePlaylistValidation = [
  param('id')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Playlist ID is required'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Playlist name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('visibility')
    .optional()
    .isIn(['public', 'private', 'unlisted'])
    .withMessage('Visibility must be public, private, or unlisted'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('Each tag must be between 1 and 30 characters'),
  body('cover.url')
    .optional()
    .isURL()
    .withMessage('Cover URL must be a valid URL'),
  body('cover.ipfsHash')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('IPFS hash cannot be empty'),
  body('isCollaborative')
    .optional()
    .isBoolean()
    .withMessage('isCollaborative must be a boolean')
];

const addTrackValidation = [
  param('id')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Playlist ID is required'),
  body('trackId')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Track ID is required'),
  body('position')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Position must be a non-negative integer')
];

const reorderTracksValidation = [
  param('id')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Playlist ID is required'),
  body('trackId')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Track ID is required'),
  body('newPosition')
    .isInt({ min: 0 })
    .withMessage('New position must be a non-negative integer')
];

const addCollaboratorValidation = [
  param('id')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Playlist ID is required'),
  body('userId')
    .trim()
    .isLength({ min: 1 })
    .withMessage('User ID is required'),
  body('permissions')
    .optional()
    .isArray()
    .withMessage('Permissions must be an array'),
  body('permissions.*')
    .optional()
    .isIn(['add', 'remove', 'edit'])
    .withMessage('Invalid permission')
];

const paginationValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be non-negative')
];

const searchValidation = [
  query('q')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
];

// Apply rate limiting to all routes
router.use(playlistLimiter);

// Public routes (no authentication required)
router.get('/public', paginationValidation, PlaylistController.getPublicPlaylists);
router.get('/featured', PlaylistController.getFeaturedPlaylists);
router.get('/trending', PlaylistController.getTrendingPlaylists);
router.get('/search', searchValidation, PlaylistController.searchPlaylists);
router.get('/stats', PlaylistController.getPlaylistStats);

// Routes with optional authentication
router.get('/:id', optionalAuth, PlaylistController.getPlaylist);
router.post('/:id/play', optionalAuth, PlaylistController.playPlaylist);

// Routes requiring authentication
router.use(authenticateToken);

// Playlist CRUD operations
router.post('/', createPlaylistValidation, PlaylistController.createPlaylist);
router.put('/:id', updatePlaylistValidation, PlaylistController.updatePlaylist);
router.delete('/:id', PlaylistController.deletePlaylist);

// Track management
router.post('/:id/tracks', addTrackValidation, PlaylistController.addTrack);
router.delete('/:id/tracks/:trackId', PlaylistController.removeTrack);
router.put('/:id/tracks/reorder', reorderTracksValidation, PlaylistController.reorderTracks);

// User interactions
router.post('/:id/like', PlaylistController.toggleLike);
router.post('/:id/follow', PlaylistController.toggleFollow);

// Collaboration management
router.post('/:id/collaborators', addCollaboratorValidation, PlaylistController.addCollaborator);
router.delete('/:id/collaborators/:userId', PlaylistController.removeCollaborator);

// User playlists
router.get('/user/:userId', paginationValidation, PlaylistController.getUserPlaylists);

// Get current user's playlists
router.get('/user', paginationValidation, PlaylistController.getCurrentUserPlaylists);

export default router;