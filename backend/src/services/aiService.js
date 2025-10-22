/**
 * AI Music Generation Service
 * Integrates with various AI music generation APIs
 */

import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Handle import.meta for both ES modules and Jest environments
let __filename, __dirname;

try {
  // Check if we're in CommonJS environment (Jest)
  if (typeof module !== 'undefined' && module.filename) {
    __filename = module.filename;
    __dirname = path.dirname(__filename);
  } else {
    // ES module environment
    try {
      // Use eval to avoid syntax error in CommonJS
      const importMeta = eval('import.meta');
      if (importMeta && importMeta.url) {
        __filename = fileURLToPath(importMeta.url);
        __dirname = path.dirname(__filename);
      }
    } catch (e) {
      // Fallback
      __filename = '';
      __dirname = '';
    }
  }
} catch (e) {
  __filename = '';
  __dirname = '';
}

class AIService {
  constructor() {
    this.replicateToken = process.env.REPLICATE_API_TOKEN;
    this.openaiKey = process.env.OPENAI_API_KEY;
  }

  /**
   * Generate music using multiple AI services
   */
  async generateMusicWithMusicGen(prompt, duration = 30) {
    try {
      console.log(`🎵 Generating music with prompt: "${prompt}"`);
      
      // Check if we have real API keys
      const hasReplicateKey = this.replicateToken && this.replicateToken !== 'your_replicate_api_token_here';
      
      if (hasReplicateKey) {
        return await this.generateWithReplicate(prompt, duration);
      } else {
        // Use enhanced mock generation
        return await this.generateMockMusic(prompt, duration);
      }
    } catch (error) {
      console.error('Music generation error:', error.message);
      // Fallback to mock generation
      return await this.generateMockMusic(prompt, duration);
    }
  }

  /**
   * Generate music using Replicate API
   */
  async generateWithReplicate(prompt, duration = 30) {
    const response = await axios.post(
      'https://api.replicate.com/v1/predictions',
      {
        version: "7a76a8258b23fae65c5a22debb8841d1d7e816b75c2f24218cd2bd8573787906",
        input: {
          prompt: prompt,
          model_version: "stereo-large",
          output_format: "mp3",
          normalization_strategy: "peak",
          duration: duration
        }
      },
      {
        headers: {
          'Authorization': `Token ${this.replicateToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const predictionId = response.data.id;
    console.log(`📊 Prediction created: ${predictionId}`);

    // Poll for completion
    return await this.pollPrediction(predictionId);
  }

  /**
   * Enhanced mock music generation for development
   */
  async generateMockMusic(prompt, duration = 30) {
    console.log(`🔧 Development mode: Generating mock music for "${prompt}"`);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
    
    // Generate different sample audio based on prompt keywords
    const audioSamples = [
      'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
      'https://www.soundjay.com/misc/sounds/fail-buzzer-02.wav',
      'https://www.soundjay.com/misc/sounds/magic-chime-02.wav',
      'https://www.soundjay.com/misc/sounds/small-bell-ringing-01.wav',
      'https://www.soundjay.com/misc/sounds/wind-chime-01.wav'
    ];
    
    // Select audio based on prompt content
    let selectedAudio = audioSamples[0];
    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.includes('electronic') || lowerPrompt.includes('techno')) {
      selectedAudio = audioSamples[1];
    } else if (lowerPrompt.includes('ambient') || lowerPrompt.includes('calm')) {
      selectedAudio = audioSamples[2];
    } else if (lowerPrompt.includes('classical') || lowerPrompt.includes('piano')) {
      selectedAudio = audioSamples[3];
    } else if (lowerPrompt.includes('nature') || lowerPrompt.includes('peaceful')) {
      selectedAudio = audioSamples[4];
    }
    
    return {
      success: true,
      audioUrl: selectedAudio,
      metadata: {
        predictionId: `mock_${Date.now()}`,
        model: 'musicgen-mock-v1.0',
        duration: duration,
        prompt: prompt,
        generatedAt: new Date().toISOString(),
        mockGeneration: true
      }
    };
  }

  /**
   * Poll Replicate prediction until completion
   */
  async pollPrediction(predictionId, maxAttempts = 60) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await axios.get(
          `https://api.replicate.com/v1/predictions/${predictionId}`,
          {
            headers: {
              'Authorization': `Token ${this.replicateToken}`
            }
          }
        );

        const prediction = response.data;
        console.log(`📊 Prediction status: ${prediction.status}`);

        if (prediction.status === 'succeeded') {
          return {
            success: true,
            audioUrl: prediction.output,
            metadata: {
              predictionId,
              model: 'musicgen-stereo-large',
              duration: prediction.input?.duration || 30,
              prompt: prediction.input?.prompt
            }
          };
        }

        if (prediction.status === 'failed') {
          throw new Error(`AI generation failed: ${prediction.error}`);
        }

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        if (attempt === maxAttempts - 1) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    throw new Error('AI generation timeout');
  }

  /**
   * Generate music description using OpenAI
   */
  async generateMusicDescription(prompt, genre, mood) {
    try {
      if (!this.openaiKey) {
        return `AI-generated ${genre} music with ${mood} mood based on: ${prompt}`;
      }

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a music critic and composer. Generate engaging, professional descriptions for AI-generated music tracks.'
            },
            {
              role: 'user',
              content: `Create a compelling description for an AI-generated ${genre} music track with a ${mood} mood. The generation prompt was: "${prompt}". Keep it under 200 characters and make it sound professional and appealing to potential buyers.`
            }
          ],
          max_tokens: 100,
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${this.openaiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content.trim();
    } catch (error) {
      console.error('OpenAI description generation error:', error.response?.data || error.message);
      return `AI-generated ${genre} music with ${mood} mood based on: ${prompt}`;
    }
  }

  /**
   * Generate cover art using AI or smart placeholders
   */
  async generateCoverArt(prompt, style = 'abstract') {
    try {
      // Check if we have OpenAI API key for DALL-E
      const hasOpenAIKey = this.openaiKey && this.openaiKey !== 'your_openai_api_key_here';
      
      if (hasOpenAIKey) {
        return await this.generateWithDALLE(prompt, style);
      } else {
        return await this.generateSmartPlaceholder(prompt, style);
      }
    } catch (error) {
      console.error('Cover art generation error:', error);
      // Fallback to smart placeholder
      return await this.generateSmartPlaceholder(prompt, style);
    }
  }

  /**
   * Generate cover art using DALL-E
   */
  async generateWithDALLE(prompt, style) {
    try {
      const artPrompt = `Album cover art for music: ${prompt}. Style: ${style}. High quality, artistic, music-themed.`;
      
      const response = await axios.post(
        'https://api.openai.com/v1/images/generations',
        {
          model: 'dall-e-3',
          prompt: artPrompt,
          n: 1,
          size: '1024x1024',
          quality: 'standard'
        },
        {
          headers: {
            'Authorization': `Bearer ${this.openaiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        imageUrl: response.data.data[0].url,
        metadata: {
          prompt: artPrompt,
          style,
          generated: true,
          model: 'dall-e-3'
        }
      };
    } catch (error) {
      console.error('DALL-E generation error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Generate smart placeholder cover art
   */
  async generateSmartPlaceholder(prompt, style) {
    console.log(`🎨 Generating smart placeholder cover for: "${prompt}"`);
    
    // Color schemes based on music genre/mood
    const colorSchemes = {
      electronic: ['6366f1', 'a855f7', '3b82f6'], // Purple/Blue
      ambient: ['10b981', '06b6d4', '8b5cf6'], // Green/Cyan/Purple
      classical: ['f59e0b', 'ef4444', '8b5cf6'], // Gold/Red/Purple
      rock: ['ef4444', 'f97316', 'eab308'], // Red/Orange/Yellow
      jazz: ['8b5cf6', 'ec4899', 'f59e0b'], // Purple/Pink/Orange
      pop: ['ec4899', 'f97316', '10b981'], // Pink/Orange/Green
      default: ['6366f1', 'a855f7', '3b82f6'] // Default purple/blue
    };

    // Determine color scheme based on prompt
    const lowerPrompt = prompt.toLowerCase();
    let colors = colorSchemes.default;
    
    for (const [genre, genreColors] of Object.entries(colorSchemes)) {
      if (lowerPrompt.includes(genre)) {
        colors = genreColors;
        break;
      }
    }

    // Select random color from scheme
    const selectedColor = colors[Math.floor(Math.random() * colors.length)];
    
    // Generate gradient placeholder with music-themed text
    const musicEmojis = ['🎵', '🎶', '🎼', '🎹', '🎸', '🥁', '🎺', '🎷'];
    const randomEmoji = musicEmojis[Math.floor(Math.random() * musicEmojis.length)];
    
    const imageUrl = `https://via.placeholder.com/512x512/${selectedColor}/ffffff?text=${encodeURIComponent(randomEmoji + ' AI Music')}`;
    
    return {
      success: true,
      imageUrl: imageUrl,
      metadata: {
        prompt,
        style,
        generated: true,
        model: 'smart-placeholder',
        colorScheme: selectedColor,
        emoji: randomEmoji
      }
    };
  }

  /**
   * Analyze audio file and extract metadata
   */
  async analyzeAudio(audioBuffer) {
    try {
      // Basic audio analysis (duration, format, etc.)
      // In a production environment, you might use libraries like:
      // - node-ffmpeg for detailed audio analysis
      // - music-metadata for extracting existing metadata
      
      return {
        duration: 30, // Placeholder
        format: 'mp3',
        sampleRate: 44100,
        bitrate: 320,
        channels: 2,
        size: audioBuffer.length
      };
    } catch (error) {
      console.error('Audio analysis error:', error);
      throw new Error(`Audio analysis failed: ${error.message}`);
    }
  }

  /**
   * Validate generation parameters
   */
  validateGenerationParams(params) {
    const { prompt, duration, genre } = params;
    
    if (!prompt || prompt.trim().length < 3) {
      throw new Error('Prompt must be at least 3 characters long');
    }
    
    if (duration && (duration < 5 || duration > 60)) {
      throw new Error('Duration must be between 5 and 60 seconds');
    }
    
    const allowedGenres = [
      'electronic', 'ambient', 'classical', 'jazz', 'rock', 
      'pop', 'hip-hop', 'techno', 'house', 'experimental'
    ];
    
    if (genre && !allowedGenres.includes(genre.toLowerCase())) {
      throw new Error(`Genre must be one of: ${allowedGenres.join(', ')}`);
    }
    
    return true;
  }
}

export default new AIService();