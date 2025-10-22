/**
 * Music Controller
 * Handles music-related business logic and Flow blockchain interactions
 */

import aiService from '../services/aiService.js';
import ipfsService from '../services/ipfsService.js';

class MusicController {
  /**
   * Generate music with AI and prepare for minting
   */
  async generateAndPrepareMusic(req, res) {
    try {
      const {
        prompt,
        title,
        artist,
        genre = 'electronic',
        mood = 'upbeat',
        duration = 30,
        royalties = []
      } = req.body;

      // Validate input
      if (!prompt || prompt.trim().length < 3) {
        return res.status(400).json({
          error: true,
          message: 'Prompt must be at least 3 characters long'
        });
      }

      console.log(`🎵 Starting music generation and preparation for: "${prompt}"`);

      // Check if we're in development mode (no real API keys)
      const isDevelopmentMode = !process.env.SUNO_API_KEY || process.env.SUNO_API_KEY === 'your_suno_api_key_here';
      
      let musicGeneration;
      if (isDevelopmentMode) {
        // Return mock data for development
        console.log('🔧 Development mode: Using mock music generation data');
        musicGeneration = {
          success: true,
          audioUrl: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', // Sample audio URL
          duration: duration,
          title: title || `AI Generated - ${prompt.substring(0, 30)}`,
          description: `Mock generated music based on: "${prompt}"`,
          metadata: {
            model: 'mock-musicgen-v1.0',
            prompt: prompt,
            duration: duration
          }
        };
      } else {
        // Step 1: Generate music with AI
        musicGeneration = await aiService.generateMusicWithMusicGen(prompt, duration);
        if (!musicGeneration.success) {
          throw new Error('Music generation failed');
        }
      }

      // Step 2: Generate description
      let description;
      if (isDevelopmentMode) {
        description = `This is a mock ${genre} track with ${mood} vibes, generated from the prompt: "${prompt}". Perfect for ${genre} enthusiasts looking for ${mood} music.`;
      } else {
        description = await aiService.generateMusicDescription(prompt, genre, mood);
      }

      // Step 3: Generate cover art
      let coverArt;
      if (isDevelopmentMode) {
        coverArt = {
          success: true,
          imageUrl: 'https://via.placeholder.com/512x512/6366f1/ffffff?text=AI+Music', // Placeholder image
          description: `Mock cover art for ${prompt}`
        };
      } else {
        coverArt = await aiService.generateCoverArt(prompt, 'abstract');
      }

      // Step 4: Upload to IPFS
      const audioFilename = `${(title || 'AI_Music').replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.mp3`;
      const audioUpload = await ipfsService.uploadAudioFromUrl(
        musicGeneration.audioUrl,
        audioFilename
      );

      let coverUpload = null;
      if (coverArt.imageUrl) {
        try {
          const coverFilename = `cover_${audioFilename.replace('.mp3', '.jpg')}`;
          const axios = (await import('axios')).default;
          const response = await axios.get(coverArt.imageUrl, {
            responseType: 'arraybuffer',
            timeout: 30000
          });
          
          const imageBuffer = Buffer.from(response.data);
          coverUpload = await ipfsService.uploadImage(imageBuffer, coverFilename);
        } catch (error) {
          console.warn('Cover image upload failed:', error.message);
        }
      }

      // Step 5: Create NFT metadata
      const nftMetadata = await ipfsService.createNFTMetadata({
        title: title || `AI Generated ${genre.charAt(0).toUpperCase() + genre.slice(1)}`,
        artist: artist || 'AI Composer',
        description: description,
        audioHash: audioUpload.hash,
        audioUrl: audioUpload.url,
        coverImageHash: coverUpload?.hash,
        coverImageUrl: coverUpload?.url,
        genre: genre,
        duration: duration,
        aiModel: musicGeneration.metadata.model,
        prompt: prompt,
        royalties: royalties
      });

      // Prepare response for frontend
      const response = {
        success: true,
        music: {
          id: musicGeneration.metadata.predictionId,
          title: nftMetadata.metadata.title,
          artist: nftMetadata.metadata.artist,
          description: nftMetadata.metadata.description,
          genre: genre,
          mood: mood,
          duration: duration,
          prompt: prompt,
          audioUrl: musicGeneration.audioUrl,
          coverImageUrl: coverArt.imageUrl,
          aiModel: musicGeneration.metadata.model,
          generatedAt: new Date().toISOString()
        },
        ipfs: {
          audio: {
            hash: audioUpload.hash,
            url: audioUpload.url
          },
          cover: coverUpload ? {
            hash: coverUpload.hash,
            url: coverUpload.url
          } : null,
          metadata: {
            hash: nftMetadata.metadataHash,
            url: nftMetadata.metadataUrl
          }
        },
        nftMetadata: nftMetadata.metadata,
        mintingData: {
          // Data needed for Flow blockchain minting
          metadataHash: nftMetadata.metadataHash,
          audioHash: audioUpload.hash,
          coverImageHash: coverUpload?.hash,
          royalties: royalties.map(r => ({
            recipient: r.recipient,
            percentage: r.percentage
          }))
        },
        message: 'Music generated and prepared for minting'
      };

      console.log(`✅ Music generation and preparation completed: ${nftMetadata.metadataHash}`);
      res.json(response);

    } catch (error) {
      console.error('Music generation and preparation error:', error);
      res.status(500).json({
        error: true,
        message: error.message || 'Music generation and preparation failed'
      });
    }
  }

  /**
   * Upload existing music file and prepare for minting
   */
  async uploadAndPrepareMusic(req, res) {
    try {
      const {
        audioBuffer,
        title,
        artist,
        description,
        genre,
        coverImageBuffer,
        royalties = []
      } = req.body;

      if (!audioBuffer || !title || !artist) {
        return res.status(400).json({
          error: true,
          message: 'Audio buffer, title, and artist are required'
        });
      }

      console.log(`🎵 Uploading and preparing music: "${title}" by ${artist}`);

      // Convert base64 to buffer if needed
      const audioData = Buffer.isBuffer(audioBuffer) 
        ? audioBuffer 
        : Buffer.from(audioBuffer, 'base64');

      // Step 1: Upload audio to IPFS
      const audioFilename = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.mp3`;
      const audioUpload = await ipfsService.uploadAudio(audioData, audioFilename);

      // Step 2: Upload cover image if provided
      let coverUpload = null;
      if (coverImageBuffer) {
        try {
          const coverData = Buffer.isBuffer(coverImageBuffer)
            ? coverImageBuffer
            : Buffer.from(coverImageBuffer, 'base64');
          
          const coverFilename = `cover_${audioFilename.replace('.mp3', '.jpg')}`;
          coverUpload = await ipfsService.uploadImage(coverData, coverFilename);
        } catch (error) {
          console.warn('Cover image upload failed:', error.message);
        }
      }

      // Step 3: Create NFT metadata
      const nftMetadata = await ipfsService.createNFTMetadata({
        title: title,
        artist: artist,
        description: description || '',
        audioHash: audioUpload.hash,
        audioUrl: audioUpload.url,
        coverImageHash: coverUpload?.hash,
        coverImageUrl: coverUpload?.url,
        genre: genre || 'Unknown',
        royalties: royalties
      });

      // Prepare response
      const response = {
        success: true,
        music: {
          title: title,
          artist: artist,
          description: description || '',
          genre: genre || 'Unknown',
          uploadedAt: new Date().toISOString()
        },
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
        mintingData: {
          metadataHash: nftMetadata.metadataHash,
          audioHash: audioUpload.hash,
          coverImageHash: coverUpload?.hash,
          royalties: royalties.map(r => ({
            recipient: r.recipient,
            percentage: r.percentage
          }))
        },
        message: 'Music uploaded and prepared for minting'
      };

      console.log(`✅ Music upload and preparation completed: ${nftMetadata.metadataHash}`);
      res.json(response);

    } catch (error) {
      console.error('Music upload and preparation error:', error);
      res.status(500).json({
        error: true,
        message: error.message || 'Music upload and preparation failed'
      });
    }
  }

  /**
   * Get music metadata from IPFS hash
   */
  async getMusicMetadata(req, res) {
    try {
      const { hash } = req.params;

      if (!hash) {
        return res.status(400).json({
          error: true,
          message: 'IPFS hash is required'
        });
      }

      console.log(`📄 Retrieving music metadata: ${hash}`);

      const fileInfo = await ipfsService.getFileInfo(hash);

      if (!fileInfo.success) {
        throw new Error('Failed to retrieve metadata');
      }

      const response = {
        success: true,
        metadata: fileInfo.info,
        message: 'Metadata retrieved successfully'
      };

      res.json(response);

    } catch (error) {
      console.error('Metadata retrieval error:', error);
      res.status(500).json({
        error: true,
        message: error.message || 'Failed to retrieve metadata'
      });
    }
  }

  /**
   * Validate music data before minting
   */
  async validateMusicData(req, res) {
    try {
      const { metadataHash, audioHash, coverImageHash } = req.body;

      if (!metadataHash || !audioHash) {
        return res.status(400).json({
          error: true,
          message: 'Metadata hash and audio hash are required'
        });
      }

      console.log(`✅ Validating music data: ${metadataHash}`);

      // Validate metadata exists
      const metadataInfo = await ipfsService.getFileInfo(metadataHash);
      if (!metadataInfo.success) {
        throw new Error('Metadata not found on IPFS');
      }

      // Validate audio exists
      const audioInfo = await ipfsService.getFileInfo(audioHash);
      if (!audioInfo.success) {
        throw new Error('Audio file not found on IPFS');
      }

      // Validate cover image if provided
      let coverInfo = null;
      if (coverImageHash) {
        coverInfo = await ipfsService.getFileInfo(coverImageHash);
        if (!coverInfo.success) {
          console.warn('Cover image not found on IPFS');
        }
      }

      const response = {
        success: true,
        validation: {
          metadata: {
            hash: metadataHash,
            valid: true,
            info: metadataInfo.info
          },
          audio: {
            hash: audioHash,
            valid: true,
            info: audioInfo.info
          },
          cover: coverImageHash ? {
            hash: coverImageHash,
            valid: coverInfo?.success || false,
            info: coverInfo?.info
          } : null
        },
        message: 'Music data validation completed'
      };

      console.log(`✅ Music data validation completed: ${metadataHash}`);
      res.json(response);

    } catch (error) {
      console.error('Music data validation error:', error);
      res.status(500).json({
        error: true,
        message: error.message || 'Music data validation failed'
      });
    }
  }
}

export default new MusicController();