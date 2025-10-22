/**
 * File Upload Routes
 * Handles file uploads with validation and processing
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import securityMiddleware from '../middleware/security.js';

const router = express.Router();

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegStatic);

// Configure multer for temporary file storage
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'temp');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}_${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024, // 50MB default
    files: 10
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      // Audio formats
      'audio/mpeg',
      'audio/wav',
      'audio/mp3',
      'audio/ogg',
      'audio/flac',
      'audio/aac',
      'audio/m4a',
      // Image formats
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      // Document formats
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
 * POST /api/upload/audio
 * Upload and process audio files
 */
router.post('/audio', 
  securityMiddleware.rateLimiters.upload,
  upload.single('audio'),
  securityMiddleware.fileUploadSecurity,
  async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: true,
        message: 'No audio file provided'
      });
    }

    const { path: filePath, originalname, mimetype, size } = req.file;
    const { title, artist, genre, description } = req.body;

    console.log(`🎵 Processing audio upload: ${originalname}`);

    // Validate audio file
    const audioInfo = await getAudioInfo(filePath);
    
    if (!audioInfo.isValid) {
      await cleanupFile(filePath);
      return res.status(400).json({
        error: true,
        message: 'Invalid audio file'
      });
    }

    // Convert to standard format if needed
    const processedPath = await processAudioFile(filePath, originalname);

    // Read processed file
    const audioBuffer = await fs.readFile(processedPath);

    // Generate waveform data
    const waveformData = await generateWaveform(processedPath);

    // Cleanup temporary files
    await cleanupFile(filePath);
    if (processedPath !== filePath) {
      await cleanupFile(processedPath);
    }

    const response = {
      success: true,
      audio: {
        filename: originalname,
        mimetype: mimetype,
        size: size,
        duration: audioInfo.duration,
        bitrate: audioInfo.bitrate,
        sampleRate: audioInfo.sampleRate,
        channels: audioInfo.channels,
        waveform: waveformData,
        buffer: audioBuffer.toString('base64')
      },
      metadata: {
        title: title || path.parse(originalname).name,
        artist: artist || 'Unknown Artist',
        genre: genre || 'Unknown',
        description: description || ''
      },
      message: 'Audio file processed successfully'
    };

    console.log(`✅ Audio processed: ${originalname} (${audioInfo.duration}s)`);
    res.json(response);

  } catch (error) {
    console.error('Audio upload error:', error);
    
    // Cleanup on error
    if (req.file?.path) {
      await cleanupFile(req.file.path).catch(() => {});
    }

    res.status(500).json({
      error: true,
      message: error.message || 'Audio upload failed'
    });
  }
});

/**
 * POST /api/upload/image
 * Upload and process image files
 */
router.post('/image', 
  securityMiddleware.rateLimiters.upload,
  upload.single('image'),
  securityMiddleware.fileUploadSecurity,
  async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: true,
        message: 'No image file provided'
      });
    }

    const { path: filePath, originalname, mimetype, size } = req.file;
    const { width, height, quality = 80 } = req.body;

    console.log(`🖼️ Processing image upload: ${originalname}`);

    // Process image with sharp
    let imageProcessor = sharp(filePath);
    
    // Get image metadata
    const metadata = await imageProcessor.metadata();

    // Resize if dimensions provided
    if (width || height) {
      imageProcessor = imageProcessor.resize(
        width ? parseInt(width) : null,
        height ? parseInt(height) : null,
        { fit: 'inside', withoutEnlargement: true }
      );
    }

    // Convert to JPEG and optimize
    const processedBuffer = await imageProcessor
      .jpeg({ quality: parseInt(quality) })
      .toBuffer();

    // Generate thumbnail
    const thumbnailBuffer = await sharp(filePath)
      .resize(200, 200, { fit: 'cover' })
      .jpeg({ quality: 70 })
      .toBuffer();

    // Cleanup temporary file
    await cleanupFile(filePath);

    const response = {
      success: true,
      image: {
        filename: originalname,
        mimetype: 'image/jpeg',
        originalSize: size,
        processedSize: processedBuffer.length,
        width: metadata.width,
        height: metadata.height,
        buffer: processedBuffer.toString('base64'),
        thumbnail: thumbnailBuffer.toString('base64')
      },
      message: 'Image file processed successfully'
    };

    console.log(`✅ Image processed: ${originalname} (${metadata.width}x${metadata.height})`);
    res.json(response);

  } catch (error) {
    console.error('Image upload error:', error);
    
    // Cleanup on error
    if (req.file?.path) {
      await cleanupFile(req.file.path).catch(() => {});
    }

    res.status(500).json({
      error: true,
      message: error.message || 'Image upload failed'
    });
  }
});

/**
 * POST /api/upload/batch
 * Upload multiple files
 */
router.post('/batch', upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: true,
        message: 'No files provided'
      });
    }

    console.log(`📁 Processing batch upload: ${req.files.length} files`);

    const processPromises = req.files.map(async (file) => {
      try {
        const { path: filePath, originalname, mimetype, size } = file;

        if (mimetype.startsWith('audio/')) {
          const audioInfo = await getAudioInfo(filePath);
          const processedPath = await processAudioFile(filePath, originalname);
          const audioBuffer = await fs.readFile(processedPath);

          await cleanupFile(filePath);
          if (processedPath !== filePath) {
            await cleanupFile(processedPath);
          }

          return {
            success: true,
            type: 'audio',
            filename: originalname,
            size: size,
            duration: audioInfo.duration,
            buffer: audioBuffer.toString('base64')
          };
        } else if (mimetype.startsWith('image/')) {
          const metadata = await sharp(filePath).metadata();
          const processedBuffer = await sharp(filePath)
            .jpeg({ quality: 80 })
            .toBuffer();

          await cleanupFile(filePath);

          return {
            success: true,
            type: 'image',
            filename: originalname,
            size: size,
            width: metadata.width,
            height: metadata.height,
            buffer: processedBuffer.toString('base64')
          };
        } else {
          const buffer = await fs.readFile(filePath);
          await cleanupFile(filePath);

          return {
            success: true,
            type: 'file',
            filename: originalname,
            size: size,
            buffer: buffer.toString('base64')
          };
        }
      } catch (error) {
        await cleanupFile(file.path).catch(() => {});
        return {
          success: false,
          filename: file.originalname,
          error: error.message
        };
      }
    });

    const results = await Promise.all(processPromises);
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    const response = {
      success: failed.length === 0,
      processed: successful.length,
      failed: failed.length,
      files: successful,
      errors: failed,
      message: `${successful.length} files processed successfully${failed.length > 0 ? `, ${failed.length} failed` : ''}`
    };

    console.log(`✅ Batch processing completed: ${successful.length}/${req.files.length} successful`);
    res.json(response);

  } catch (error) {
    console.error('Batch upload error:', error);
    
    // Cleanup all files on error
    if (req.files) {
      await Promise.all(
        req.files.map(file => cleanupFile(file.path).catch(() => {}))
      );
    }

    res.status(500).json({
      error: true,
      message: error.message || 'Batch upload failed'
    });
  }
});

// Helper functions

async function getAudioInfo(filePath) {
  return new Promise((resolve) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        resolve({ isValid: false });
        return;
      }

      const audioStream = metadata.streams.find(s => s.codec_type === 'audio');
      if (!audioStream) {
        resolve({ isValid: false });
        return;
      }

      resolve({
        isValid: true,
        duration: parseFloat(metadata.format.duration) || 0,
        bitrate: parseInt(metadata.format.bit_rate) || 0,
        sampleRate: parseInt(audioStream.sample_rate) || 0,
        channels: parseInt(audioStream.channels) || 0,
        codec: audioStream.codec_name
      });
    });
  });
}

async function processAudioFile(inputPath, originalName) {
  const outputPath = path.join(
    path.dirname(inputPath),
    `processed_${path.parse(originalName).name}.mp3`
  );

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioCodec('libmp3lame')
      .audioBitrate(192)
      .audioChannels(2)
      .audioFrequency(44100)
      .output(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', reject)
      .run();
  });
}

async function generateWaveform(filePath) {
  // Simple waveform generation - in production, use a proper audio analysis library
  try {
    const audioInfo = await getAudioInfo(filePath);
    const duration = audioInfo.duration || 30;
    const samples = Math.min(1000, duration * 10); // 10 samples per second, max 1000
    
    // Generate mock waveform data
    const waveform = [];
    for (let i = 0; i < samples; i++) {
      waveform.push(Math.random() * 0.8 + 0.1); // Random values between 0.1 and 0.9
    }
    
    return waveform;
  } catch (error) {
    console.warn('Waveform generation failed:', error.message);
    return [];
  }
}

async function cleanupFile(filePath) {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.warn(`Failed to cleanup file ${filePath}:`, error.message);
  }
}

export default router;