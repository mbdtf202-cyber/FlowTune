/**
 * Music Routes
 * Handles music-related API endpoints
 */

import express from 'express';
import musicController from '../controllers/musicController.js';
import { aiRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

/**
 * POST /api/music/generate
 * Generate music with AI and prepare for minting
 */
router.post('/generate', aiRateLimiter, musicController.generateAndPrepareMusic);

/**
 * POST /api/music/upload
 * Upload existing music and prepare for minting
 */
router.post('/upload', musicController.uploadAndPrepareMusic);

/**
 * GET /api/music/metadata/:hash
 * Get music metadata from IPFS hash
 */
router.get('/metadata/:hash', musicController.getMusicMetadata);

/**
 * POST /api/music/validate
 * Validate music data before minting
 */
router.post('/validate', musicController.validateMusicData);

export default router;