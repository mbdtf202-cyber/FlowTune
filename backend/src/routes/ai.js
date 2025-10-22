/**
 * AI Music Generation Routes
 * Handles AI music generation requests and responses
 */

import express from 'express';
import aiService from '../services/aiService.js';
import ipfsService from '../services/ipfsService.js';
import { aiRateLimiter } from '../middleware/rateLimiter.js';
import securityMiddleware from '../middleware/security.js';

const router = express.Router();

/**
 * POST /api/ai/generate
 * Generate music using AI
 */
router.post('/generate', 
  securityMiddleware.rateLimiters.aiGeneration,
  securityMiddleware.validateInput(securityMiddleware.validationRules.userInput),
  async (req, res) => {
  try {
    const {
      prompt,
      duration = 30,
      genre = 'electronic',
      mood = 'upbeat',
      title,
      artist
    } = req.body;

    // Validate input
    if (!prompt || prompt.trim().length < 3) {
      return res.status(400).json({
        error: true,
        message: 'Prompt must be at least 3 characters long'
      });
    }

    // Validate generation parameters
    aiService.validateGenerationParams({ prompt, duration, genre });

    console.log(`🎵 Starting AI music generation for: "${prompt}"`);

    // Generate music
    const generationResult = await aiService.generateMusicWithMusicGen(
      prompt,
      duration
    );

    if (!generationResult.success) {
      throw new Error('AI music generation failed');
    }

    // Generate description
    const description = await aiService.generateMusicDescription(
      prompt,
      genre,
      mood
    );

    // Generate cover art
    const coverArt = await aiService.generateCoverArt(prompt, 'abstract');

    // Prepare response
    const response = {
      success: true,
      generation: {
        id: generationResult.metadata.predictionId,
        audioUrl: generationResult.audioUrl,
        coverImageUrl: coverArt.imageUrl,
        metadata: {
          title: title || `AI Generated ${genre.charAt(0).toUpperCase() + genre.slice(1)}`,
          artist: artist || 'AI Composer',
          description: description,
          genre: genre,
          mood: mood,
          duration: duration,
          prompt: prompt,
          aiModel: generationResult.metadata.model,
          generatedAt: new Date().toISOString()
        }
      },
      message: 'Music generated successfully'
    };

    console.log(`✅ AI music generation completed: ${generationResult.metadata.predictionId}`);
    res.json(response);

  } catch (error) {
    console.error('AI generation error:', error);
    res.status(500).json({
      error: true,
      message: error.message || 'AI music generation failed'
    });
  }
});

/**
 * POST /api/ai/upload-to-ipfs
 * Upload generated music and metadata to IPFS
 */
router.post('/upload-to-ipfs', async (req, res) => {
  try {
    const {
      audioUrl,
      coverImageUrl,
      metadata,
      royalties = []
    } = req.body;

    if (!audioUrl || !metadata) {
      return res.status(400).json({
        error: true,
        message: 'Audio URL and metadata are required'
      });
    }

    console.log(`📦 Uploading to IPFS: ${metadata.title}`);

    // Upload audio to IPFS
    const audioFilename = `${metadata.title.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.mp3`;
    const audioUpload = await ipfsService.uploadAudioFromUrl(audioUrl, audioFilename);

    let coverUpload = null;
    if (coverImageUrl) {
      try {
        // Upload cover image to IPFS
        const coverFilename = `cover_${metadata.title.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.jpg`;
        
        // Download and upload cover image
        const axios = (await import('axios')).default;
        const response = await axios.get(coverImageUrl, {
          responseType: 'arraybuffer',
          timeout: 30000
        });
        
        const imageBuffer = Buffer.from(response.data);
        coverUpload = await ipfsService.uploadImage(imageBuffer, coverFilename);
      } catch (error) {
        console.warn('Cover image upload failed, using placeholder:', error.message);
        coverUpload = {
          success: true,
          hash: 'QmPlaceholder',
          url: 'https://picsum.photos/512/512?random=' + Date.now()
        };
      }
    }

    // Create NFT metadata
    const nftMetadata = await ipfsService.createNFTMetadata({
      title: metadata.title,
      artist: metadata.artist,
      description: metadata.description,
      audioHash: audioUpload.hash,
      audioUrl: audioUpload.url,
      coverImageHash: coverUpload?.hash,
      coverImageUrl: coverUpload?.url,
      genre: metadata.genre,
      duration: metadata.duration,
      aiModel: metadata.aiModel,
      prompt: metadata.prompt,
      royalties: royalties
    });

    const response = {
      success: true,
      ipfs: {
        audio: {
          hash: audioUpload.hash,
          url: audioUpload.url,
          size: audioUpload.size
        },
        cover: coverUpload ? {
          hash: coverUpload.hash,
          url: coverUpload.url,
          size: coverUpload.size
        } : null,
        metadata: {
          hash: nftMetadata.metadataHash,
          url: nftMetadata.metadataUrl
        }
      },
      nftMetadata: nftMetadata.metadata,
      message: 'Successfully uploaded to IPFS'
    };

    console.log(`✅ IPFS upload completed: ${nftMetadata.metadataHash}`);
    res.json(response);

  } catch (error) {
    console.error('IPFS upload error:', error);
    res.status(500).json({
      error: true,
      message: error.message || 'IPFS upload failed'
    });
  }
});

/**
 * GET /api/ai/models
 * Get available AI models
 */
router.get('/models', (req, res) => {
  res.json({
    success: true,
    models: [
      {
        id: 'musicgen-stereo-large',
        name: 'MusicGen Stereo Large',
        description: 'High-quality stereo music generation',
        maxDuration: 60,
        provider: 'Meta/Replicate'
      },
      {
        id: 'musicgen-large',
        name: 'MusicGen Large',
        description: 'Large model for diverse music generation',
        maxDuration: 30,
        provider: 'Meta/Replicate'
      }
    ]
  });
});

/**
 * GET /api/ai/genres
 * Get supported music genres
 */
router.get('/genres', (req, res) => {
  res.json({
    success: true,
    genres: [
      'electronic',
      'ambient',
      'classical',
      'jazz',
      'rock',
      'pop',
      'hip-hop',
      'techno',
      'house',
      'experimental',
      'cinematic',
      'lo-fi',
      'synthwave',
      'drum-and-bass'
    ]
  });
});

/**
 * POST /api/ai/analyze
 * Analyze uploaded audio file
 */
router.post('/analyze', async (req, res) => {
  try {
    const { audioData } = req.body;
    
    if (!audioData) {
      return res.status(400).json({
        error: true,
        message: 'Audio data is required'
      });
    }

    // Convert base64 to buffer
    const audioBuffer = Buffer.from(audioData, 'base64');
    
    // Analyze audio
    const analysis = await aiService.analyzeAudio(audioBuffer);
    
    res.json({
      success: true,
      analysis: analysis
    });

  } catch (error) {
    console.error('Audio analysis error:', error);
    res.status(500).json({
      error: true,
      message: error.message || 'Audio analysis failed'
    });
  }
});

export default router;