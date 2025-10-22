/**
 * IPFS Service
 * Handles uploading files and metadata to IPFS using multiple providers
 */

import { create } from 'ipfs-http-client';
import pkg from '@pinata/sdk';
const { PinataSDK } = pkg;
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

class IPFSService {
  constructor() {
    // Initialize Pinata only if JWT is provided
    if (process.env.PINATA_JWT && process.env.PINATA_JWT !== 'your_pinata_jwt_here') {
      try {
        this.pinata = new PinataSDK({
          pinataJwt: process.env.PINATA_JWT,
          pinataGateway: process.env.PINATA_GATEWAY || 'gateway.pinata.cloud'
        });
      } catch (error) {
        console.warn('Failed to initialize Pinata SDK:', error.message);
        this.pinata = null;
      }
    } else {
      console.log('Pinata SDK not initialized - missing or placeholder JWT');
      this.pinata = null;
    }
    
    // Initialize IPFS client (Infura) only if credentials are provided
    if (process.env.INFURA_PROJECT_ID && 
        process.env.INFURA_PROJECT_ID !== 'your_infura_project_id_here') {
      try {
        this.ipfsClient = create({
          host: 'ipfs.infura.io',
          port: 5001,
          protocol: 'https',
          headers: {
            authorization: `Basic ${Buffer.from(
              `${process.env.INFURA_PROJECT_ID}:${process.env.INFURA_PROJECT_SECRET}`
            ).toString('base64')}`
          }
        });
      } catch (error) {
        console.warn('Failed to initialize IPFS client:', error.message);
        this.ipfsClient = null;
      }
    } else {
      console.log('IPFS client not initialized - missing or placeholder credentials');
      this.ipfsClient = null;
    }
  }

  /**
   * Generate mock IPFS hash for development
   */
  generateMockHash(filename) {
    const timestamp = Date.now().toString();
    const randomStr = Math.random().toString(36).substring(2, 15);
    return `Qm${timestamp}${randomStr}${filename.replace(/[^a-zA-Z0-9]/g, '')}`.substring(0, 46);
  }

  /**
   * Upload file to IPFS using Pinata
   */
  async uploadFileToPinata(fileBuffer, filename, options = {}) {
    // Development mode - return mock data
    if (!this.pinata) {
      console.log(`🔧 Development mode: Simulating upload of ${filename}`);
      const mockHash = this.generateMockHash(filename);
      
      return {
        success: true,
        hash: mockHash,
        url: `https://gateway.pinata.cloud/ipfs/${mockHash}`,
        size: fileBuffer.length,
        filename: filename,
        timestamp: new Date().toISOString()
      };
    }

    try {
      console.log(`📦 Uploading ${filename} to Pinata...`);
      
      const result = await this.pinata.pinFileToIPFS(fileBuffer, {
        pinataMetadata: {
          name: filename,
          keyvalues: {
            type: options.type || 'file',
            uploadedAt: new Date().toISOString(),
            ...options.metadata
          }
        },
        pinataOptions: {
          cidVersion: 1
        }
      });

      console.log(`✅ File uploaded to Pinata: ${result.IpfsHash}`);
      
      return {
        success: true,
        hash: result.IpfsHash,
        url: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
        provider: 'pinata',
        size: fileBuffer.length
      };
    } catch (error) {
      console.error('Pinata upload error:', error);
      throw new Error(`Pinata upload failed: ${error.message}`);
    }
  }

  /**
   * Upload JSON metadata to IPFS
   */
  async uploadMetadata(metadata) {
    // Development mode - return mock data
    if (!this.pinata) {
      console.log('🔧 Development mode: Simulating metadata upload');
      const mockHash = this.generateMockHash('metadata.json');
      
      return {
        success: true,
        hash: mockHash,
        url: `https://gateway.pinata.cloud/ipfs/${mockHash}`,
        metadata: metadata,
        timestamp: new Date().toISOString()
      };
    }

    try {
      console.log('📦 Uploading metadata to IPFS...');
      
      const metadataBuffer = Buffer.from(JSON.stringify(metadata, null, 2));
      
      const result = await this.pinata.pinJSONToIPFS(metadata, {
        pinataMetadata: {
          name: `metadata-${Date.now()}.json`,
          keyvalues: {
            type: 'metadata',
            nftType: 'music',
            uploadedAt: new Date().toISOString()
          }
        }
      });

      console.log(`✅ Metadata uploaded: ${result.IpfsHash}`);
      
      return {
        success: true,
        hash: result.IpfsHash,
        url: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
        provider: 'pinata'
      };
    } catch (error) {
      console.error('Metadata upload error:', error);
      throw new Error(`Metadata upload failed: ${error.message}`);
    }
  }

  /**
   * Upload audio file from URL to IPFS with retry mechanism
   */
  async uploadAudioFromUrl(audioUrl, filename, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📦 Downloading and uploading audio from: ${audioUrl} (Attempt ${attempt}/${maxRetries})`);
        
        // Download the audio file with extended timeout
        const response = await axios.get(audioUrl, {
          responseType: 'arraybuffer',
          timeout: 120000, // 2 minutes timeout
          headers: {
            'User-Agent': 'FlowTune-Bot/1.0'
          }
        });
        
        const audioBuffer = Buffer.from(response.data);
        console.log(`📊 Downloaded audio file: ${audioBuffer.length} bytes`);
        
        // Validate audio file size
        if (audioBuffer.length === 0) {
          throw new Error('Downloaded audio file is empty');
        }
        
        if (audioBuffer.length > 50 * 1024 * 1024) { // 50MB limit
          throw new Error('Audio file too large (max 50MB)');
        }
        
        // Upload to IPFS
        const uploadResult = await this.uploadFileToPinata(audioBuffer, filename, {
          type: 'audio',
          metadata: {
            originalUrl: audioUrl,
            format: path.extname(filename).slice(1),
            size: audioBuffer.length,
            uploadedAt: new Date().toISOString()
          }
        });
        
        console.log(`✅ Audio uploaded successfully: ${uploadResult.hash}`);
        return uploadResult;
        
      } catch (error) {
        lastError = error;
        console.error(`❌ Audio upload attempt ${attempt} failed:`, error.message);
        
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(`⏳ Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw new Error(`Audio upload failed after ${maxRetries} attempts: ${lastError.message}`);
  }

  /**
   * Upload image to IPFS
   */
  async uploadImage(imageBuffer, filename) {
    try {
      console.log(`📦 Uploading image: ${filename}`);
      
      return await this.uploadFileToPinata(imageBuffer, filename, {
        type: 'image',
        metadata: {
          format: path.extname(filename).slice(1),
          size: imageBuffer.length
        }
      });
    } catch (error) {
      console.error('Image upload error:', error);
      throw new Error(`Image upload failed: ${error.message}`);
    }
  }

  /**
   * Create complete NFT metadata structure
   */
  async createNFTMetadata(params) {
    try {
      const {
        title,
        artist,
        description,
        audioUrl,
        audioHash,
        coverImageUrl,
        coverImageHash,
        genre,
        duration,
        aiModel,
        prompt,
        royalties = []
      } = params;

      const metadata = {
        name: title,
        description: description,
        image: coverImageUrl || `https://gateway.pinata.cloud/ipfs/${coverImageHash}`,
        animation_url: audioUrl || `https://gateway.pinata.cloud/ipfs/${audioHash}`,
        
        // Standard NFT metadata
        attributes: [
          {
            trait_type: "Artist",
            value: artist
          },
          {
            trait_type: "Genre",
            value: genre
          },
          {
            trait_type: "Duration",
            value: duration,
            display_type: "number"
          },
          {
            trait_type: "AI Model",
            value: aiModel
          },
          {
            trait_type: "Generated",
            value: true
          }
        ],
        
        // FlowTune specific metadata
        flowtune: {
          version: "1.0",
          type: "music_nft",
          audio: {
            url: audioUrl || `https://gateway.pinata.cloud/ipfs/${audioHash}`,
            hash: audioHash,
            format: "mp3",
            duration: duration
          },
          cover: {
            url: coverImageUrl || `https://gateway.pinata.cloud/ipfs/${coverImageHash}`,
            hash: coverImageHash
          },
          generation: {
            aiModel: aiModel,
            prompt: prompt,
            generatedAt: new Date().toISOString()
          },
          royalties: royalties,
          playCount: 0,
          totalEarnings: "0.0"
        },
        
        // External URLs
        external_url: "https://flowtune.ai",
        
        // Creation timestamp
        created_at: new Date().toISOString()
      };

      // Upload metadata to IPFS
      const metadataResult = await this.uploadMetadata(metadata);
      
      return {
        success: true,
        metadata: metadata,
        metadataHash: metadataResult.hash,
        metadataUrl: metadataResult.url
      };
    } catch (error) {
      console.error('NFT metadata creation error:', error);
      throw new Error(`NFT metadata creation failed: ${error.message}`);
    }
  }

  /**
   * Pin existing IPFS hash (useful for ensuring persistence)
   */
  async pinHash(hash, name) {
    // Development mode - return mock data
    if (!this.pinata) {
      console.log(`🔧 Development mode: Simulating pin of ${hash} with name ${name}`);
      return {
        success: true,
        hash: hash,
        pinned: true,
        mockPin: true
      };
    }

    try {
      const result = await this.pinata.pinByHash(hash, {
        pinataMetadata: {
          name: name,
          keyvalues: {
            pinnedAt: new Date().toISOString()
          }
        }
      });
      
      return {
        success: true,
        hash: hash,
        pinned: true
      };
    } catch (error) {
      console.error('Pin hash error:', error);
      throw new Error(`Pin hash failed: ${error.message}`);
    }
  }

  /**
   * Get file info from IPFS
   */
  async getFileInfo(hash) {
    // Development mode - return mock data
    if (!this.pinata) {
      console.log(`🔧 Development mode: Simulating file info for ${hash}`);
      return {
        success: true,
        hash: hash,
        size: '1024',
        type: 'application/octet-stream',
        accessible: true,
        mockInfo: true
      };
    }

    try {
      const response = await axios.head(`https://gateway.pinata.cloud/ipfs/${hash}`);
      
      return {
        success: true,
        hash: hash,
        size: response.headers['content-length'],
        type: response.headers['content-type'],
        accessible: true
      };
    } catch (error) {
      console.error('Get file info error:', error);
      return {
        success: false,
        hash: hash,
        accessible: false,
        error: error.message
      };
    }
  }

  /**
   * List pinned files
   */
  async listPinnedFiles(options = {}) {
    // Development mode - return mock data
    if (!this.pinata) {
      console.log(`🔧 Development mode: Simulating pinned files list`);
      return {
        success: true,
        files: [
          {
            hash: 'QmMockHash1234567890',
            name: 'mock-file-1.mp3',
            size: 1024,
            pinned_at: new Date().toISOString()
          },
          {
            hash: 'QmMockHash0987654321',
            name: 'mock-file-2.jpg',
            size: 2048,
            pinned_at: new Date().toISOString()
          }
        ],
        count: 2,
        mockList: true
      };
    }

    try {
      const result = await this.pinata.pinList({
        status: 'pinned',
        pageLimit: options.limit || 10,
        pageOffset: options.offset || 0,
        metadata: options.metadata
      });
      
      return {
        success: true,
        files: result.rows,
        count: result.count
      };
    } catch (error) {
      console.error('List pinned files error:', error);
      throw new Error(`List files failed: ${error.message}`);
    }
  }
}

export default new IPFSService();