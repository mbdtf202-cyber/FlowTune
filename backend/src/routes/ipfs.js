/**
 * IPFS Routes
 * Handles IPFS file upload and metadata management
 */

import express from 'express';
import multer from 'multer';
import ipfsService from '../services/ipfsService.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024, // 50MB default
    files: 5
  },
  fileFilter: (req, file, cb) => {
    // Allow audio, image, and JSON files
    const allowedMimes = [
      'audio/mpeg',
      'audio/wav',
      'audio/mp3',
      'audio/ogg',
      'audio/flac',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/json',
      'text/plain'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`), false);
    }
  }
});

/**
 * POST /api/ipfs/upload
 * Upload single file to IPFS
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: true,
        message: 'No file provided'
      });
    }

    const { originalname, buffer, mimetype, size } = req.file;
    const { description, tags } = req.body;

    console.log(`📁 Uploading file to IPFS: ${originalname} (${(size / 1024 / 1024).toFixed(2)}MB)`);

    let uploadResult;

    // Route to appropriate upload method based on file type
    if (mimetype.startsWith('audio/')) {
      uploadResult = await ipfsService.uploadAudio(buffer, originalname);
    } else if (mimetype.startsWith('image/')) {
      uploadResult = await ipfsService.uploadImage(buffer, originalname);
    } else {
      uploadResult = await ipfsService.uploadFile(buffer, originalname);
    }

    if (!uploadResult.success) {
      throw new Error('File upload to IPFS failed');
    }

    // Create file metadata
    const metadata = {
      filename: originalname,
      mimetype: mimetype,
      size: size,
      hash: uploadResult.hash,
      url: uploadResult.url,
      description: description || '',
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      uploadedAt: new Date().toISOString()
    };

    // Upload metadata to IPFS
    const metadataResult = await ipfsService.uploadJSON(metadata, `${originalname}_metadata.json`);

    const response = {
      success: true,
      file: {
        hash: uploadResult.hash,
        url: uploadResult.url,
        size: uploadResult.size,
        filename: originalname,
        mimetype: mimetype
      },
      metadata: {
        hash: metadataResult.hash,
        url: metadataResult.url,
        data: metadata
      },
      message: 'File uploaded successfully to IPFS'
    };

    console.log(`✅ File uploaded to IPFS: ${uploadResult.hash}`);
    res.json(response);

  } catch (error) {
    console.error('IPFS upload error:', error);
    res.status(500).json({
      error: true,
      message: error.message || 'File upload failed'
    });
  }
});

/**
 * POST /api/ipfs/upload-multiple
 * Upload multiple files to IPFS
 */
router.post('/upload-multiple', upload.array('files', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: true,
        message: 'No files provided'
      });
    }

    console.log(`📁 Uploading ${req.files.length} files to IPFS`);

    const uploadPromises = req.files.map(async (file) => {
      const { originalname, buffer, mimetype, size } = file;

      try {
        let uploadResult;

        if (mimetype.startsWith('audio/')) {
          uploadResult = await ipfsService.uploadAudio(buffer, originalname);
        } else if (mimetype.startsWith('image/')) {
          uploadResult = await ipfsService.uploadImage(buffer, originalname);
        } else {
          uploadResult = await ipfsService.uploadFile(buffer, originalname);
        }

        return {
          success: true,
          filename: originalname,
          hash: uploadResult.hash,
          url: uploadResult.url,
          size: uploadResult.size,
          mimetype: mimetype
        };
      } catch (error) {
        return {
          success: false,
          filename: originalname,
          error: error.message
        };
      }
    });

    const results = await Promise.all(uploadPromises);
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    const response = {
      success: failed.length === 0,
      uploaded: successful.length,
      failed: failed.length,
      files: successful,
      errors: failed,
      message: `${successful.length} files uploaded successfully${failed.length > 0 ? `, ${failed.length} failed` : ''}`
    };

    console.log(`✅ Batch upload completed: ${successful.length}/${req.files.length} successful`);
    res.json(response);

  } catch (error) {
    console.error('Batch IPFS upload error:', error);
    res.status(500).json({
      error: true,
      message: error.message || 'Batch upload failed'
    });
  }
});

/**
 * POST /api/ipfs/upload-json
 * Upload JSON metadata to IPFS
 */
router.post('/upload-json', async (req, res) => {
  try {
    const { data, filename } = req.body;

    if (!data) {
      return res.status(400).json({
        error: true,
        message: 'JSON data is required'
      });
    }

    const jsonFilename = filename || `metadata_${Date.now()}.json`;

    console.log(`📄 Uploading JSON to IPFS: ${jsonFilename}`);

    const uploadResult = await ipfsService.uploadJSON(data, jsonFilename);

    if (!uploadResult.success) {
      throw new Error('JSON upload to IPFS failed');
    }

    const response = {
      success: true,
      metadata: {
        hash: uploadResult.hash,
        url: uploadResult.url,
        size: uploadResult.size,
        filename: jsonFilename
      },
      message: 'JSON uploaded successfully to IPFS'
    };

    console.log(`✅ JSON uploaded to IPFS: ${uploadResult.hash}`);
    res.json(response);

  } catch (error) {
    console.error('JSON IPFS upload error:', error);
    res.status(500).json({
      error: true,
      message: error.message || 'JSON upload failed'
    });
  }
});

/**
 * POST /api/ipfs/upload-from-url
 * Upload file from URL to IPFS
 */
router.post('/upload-from-url', async (req, res) => {
  try {
    const { url, filename, type = 'audio' } = req.body;

    if (!url) {
      return res.status(400).json({
        error: true,
        message: 'URL is required'
      });
    }

    console.log(`🔗 Uploading from URL to IPFS: ${url}`);

    let uploadResult;
    const finalFilename = filename || `file_${Date.now()}`;

    if (type === 'audio') {
      uploadResult = await ipfsService.uploadAudioFromUrl(url, finalFilename);
    } else {
      // For other types, download and upload as generic file
      const axios = (await import('axios')).default;
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 30000
      });
      
      const buffer = Buffer.from(response.data);
      uploadResult = await ipfsService.uploadFile(buffer, finalFilename);
    }

    if (!uploadResult.success) {
      throw new Error('URL upload to IPFS failed');
    }

    const responseData = {
      success: true,
      file: {
        hash: uploadResult.hash,
        url: uploadResult.url,
        size: uploadResult.size,
        filename: finalFilename,
        originalUrl: url
      },
      message: 'File uploaded successfully from URL to IPFS'
    };

    console.log(`✅ URL file uploaded to IPFS: ${uploadResult.hash}`);
    res.json(responseData);

  } catch (error) {
    console.error('URL IPFS upload error:', error);
    res.status(500).json({
      error: true,
      message: error.message || 'URL upload failed'
    });
  }
});

/**
 * GET /api/ipfs/info/:hash
 * Get file information from IPFS hash
 */
router.get('/info/:hash', async (req, res) => {
  try {
    const { hash } = req.params;

    if (!hash) {
      return res.status(400).json({
        error: true,
        message: 'IPFS hash is required'
      });
    }

    console.log(`ℹ️ Getting IPFS file info: ${hash}`);

    const fileInfo = await ipfsService.getFileInfo(hash);

    if (!fileInfo.success) {
      throw new Error('Failed to get file information');
    }

    const response = {
      success: true,
      file: fileInfo.info,
      message: 'File information retrieved successfully'
    };

    res.json(response);

  } catch (error) {
    console.error('IPFS info error:', error);
    res.status(500).json({
      error: true,
      message: error.message || 'Failed to get file information'
    });
  }
});

/**
 * POST /api/ipfs/pin/:hash
 * Pin existing IPFS hash
 */
router.post('/pin/:hash', async (req, res) => {
  try {
    const { hash } = req.params;
    const { name } = req.body;

    if (!hash) {
      return res.status(400).json({
        error: true,
        message: 'IPFS hash is required'
      });
    }

    console.log(`📌 Pinning IPFS hash: ${hash}`);

    const pinResult = await ipfsService.pinHash(hash, name);

    if (!pinResult.success) {
      throw new Error('Failed to pin IPFS hash');
    }

    const response = {
      success: true,
      pin: {
        hash: hash,
        name: name || hash,
        status: 'pinned'
      },
      message: 'Hash pinned successfully'
    };

    console.log(`✅ IPFS hash pinned: ${hash}`);
    res.json(response);

  } catch (error) {
    console.error('IPFS pin error:', error);
    res.status(500).json({
      error: true,
      message: error.message || 'Failed to pin hash'
    });
  }
});

export default router;