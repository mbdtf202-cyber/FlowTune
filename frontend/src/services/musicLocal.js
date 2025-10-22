/**
 * Local Music Service - Local music service simulation
 * Replaces real AI music generation API calls in demo mode
 */

class MusicServiceLocal {
  constructor() {
    this.isGenerating = false
    this.generationQueue = []
    this.sampleTracks = [
      {
        id: 'demo-track-1',
        title: 'Ambient Dreams',
        artist: 'AI Composer',
        genre: 'Ambient',
        duration: 180,
        description: 'A peaceful ambient track with ethereal soundscapes',
        tags: ['ambient', 'peaceful', 'ethereal'],
        bpm: 70,
        key: 'C major',
        mood: 'calm'
      },
      {
        id: 'demo-track-2',
        title: 'Electronic Pulse',
        artist: 'AI Composer',
        genre: 'Electronic',
        duration: 240,
        description: 'An energetic electronic track with driving beats',
        tags: ['electronic', 'energetic', 'beats'],
        bpm: 128,
        key: 'A minor',
        mood: 'energetic'
      },
      {
        id: 'demo-track-3',
        title: 'Jazz Fusion',
        artist: 'AI Composer',
        genre: 'Jazz',
        duration: 300,
        description: 'A sophisticated jazz fusion piece with complex harmonies',
        tags: ['jazz', 'fusion', 'sophisticated'],
        bpm: 120,
        key: 'F major',
        mood: 'sophisticated'
      },
      {
        id: 'demo-track-4',
        title: 'Rock Anthem',
        artist: 'AI Composer',
        genre: 'Rock',
        duration: 210,
        description: 'A powerful rock anthem with driving guitars',
        tags: ['rock', 'powerful', 'guitars'],
        bpm: 140,
        key: 'E minor',
        mood: 'powerful'
      },
      {
        id: 'demo-track-5',
        title: 'Classical Interlude',
        artist: 'AI Composer',
        genre: 'Classical',
        duration: 360,
        description: 'A beautiful classical piece with orchestral arrangements',
        tags: ['classical', 'orchestral', 'beautiful'],
        bpm: 80,
        key: 'D major',
        mood: 'elegant'
      }
    ]
  }

  /**
   * Generate simulated audio file
   * @param {number} duration - Audio duration in seconds
   * @returns {Promise<Blob>} Audio file blob
   */
  async generateAudioBlob(duration = 180) {
    // Create a simple audio context to generate silent audio
    const sampleRate = 44100
    const channels = 2
    const length = sampleRate * duration
    
    // Create AudioBuffer
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const buffer = audioContext.createBuffer(channels, length, sampleRate)
    
    // Generate simple sine wave audio (for demonstration)
    for (let channel = 0; channel < channels; channel++) {
      const channelData = buffer.getChannelData(channel)
      for (let i = 0; i < length; i++) {
        // Generate low volume sine wave
        channelData[i] = Math.sin(2 * Math.PI * 440 * i / sampleRate) * 0.1
      }
    }
    
    // Convert AudioBuffer to WAV format Blob
    const wavBlob = await this.audioBufferToWav(buffer)
    return wavBlob
  }

  /**
   * Convert AudioBuffer to WAV format
   * @param {AudioBuffer} buffer - Audio buffer
   * @returns {Promise<Blob>} WAV format blob
   */
  async audioBufferToWav(buffer) {
    const length = buffer.length
    const numberOfChannels = buffer.numberOfChannels
    const sampleRate = buffer.sampleRate
    const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2)
    const view = new DataView(arrayBuffer)
    
    // WAV file header
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
      }
    }
    
    writeString(0, 'RIFF')
    view.setUint32(4, 36 + length * numberOfChannels * 2, true)
    writeString(8, 'WAVE')
    writeString(12, 'fmt ')
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true)
    view.setUint16(22, numberOfChannels, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * numberOfChannels * 2, true)
    view.setUint16(32, numberOfChannels * 2, true)
    view.setUint16(34, 16, true)
    writeString(36, 'data')
    view.setUint32(40, length * numberOfChannels * 2, true)
    
    // Write audio data
    let offset = 44
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]))
        view.setInt16(offset, sample * 0x7FFF, true)
        offset += 2
      }
    }
    
    return new Blob([arrayBuffer], { type: 'audio/wav' })
  }

  /**
   * Simulate music generation
   * @param {Object} params - Generation parameters
   * @returns {Promise<Object>} Generation result
   */
  async generateMusic(params = {}) {
    try {
      console.log('🎵 Local Music: Simulating music generation', params)
      
      if (this.isGenerating) {
        throw new Error('Music generation already in progress')
      }
      
      this.isGenerating = true
      
      // Simulate generation delay
      const generationTime = 3000 + Math.random() * 5000 // 3-8 seconds
      await new Promise(resolve => setTimeout(resolve, generationTime))
      
      // Randomly select a sample track as base
      const baseTrack = this.sampleTracks[Math.floor(Math.random() * this.sampleTracks.length)]
      
      // Adjust track information based on parameters
      const generatedTrack = {
        ...baseTrack,
        id: `generated-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
        title: params.title || `Generated ${baseTrack.genre} Track`,
        description: params.description || baseTrack.description,
        genre: params.genre || baseTrack.genre,
        duration: params.duration || baseTrack.duration,
        tags: params.tags || baseTrack.tags,
        bpm: params.bpm || baseTrack.bpm,
        key: params.key || baseTrack.key,
        mood: params.mood || baseTrack.mood,
        generatedAt: new Date().toISOString(),
        prompt: params.prompt || 'Demo generation prompt',
        model: 'Local Demo Model v1.0'
      }
      
      // Generate audio file
      const audioBlob = await this.generateAudioBlob(generatedTrack.duration)
      const audioFile = new File([audioBlob], `${generatedTrack.title}.wav`, { type: 'audio/wav' })
      
      // Create local URL
      const audioUrl = URL.createObjectURL(audioBlob)
      
      console.log('✅ Local Music: Generation completed', { 
        title: generatedTrack.title, 
        duration: generatedTrack.duration 
      })
      
      this.isGenerating = false
      
      return {
        success: true,
        track: generatedTrack,
        audioFile: audioFile,
        audioUrl: audioUrl,
        metadata: {
          format: 'wav',
          sampleRate: 44100,
          channels: 2,
          bitDepth: 16,
          fileSize: audioBlob.size
        }
      }
    } catch (error) {
      console.error('❌ Local Music generation error:', error)
      this.isGenerating = false
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Get generation status
   * @returns {Object} Current status
   */
  getGenerationStatus() {
    return {
      isGenerating: this.isGenerating,
      queueLength: this.generationQueue.length
    }
  }

  /**
   * Cancel current generation
   */
  cancelGeneration() {
    console.log('🛑 Local Music: Cancelling generation')
    this.isGenerating = false
    this.generationQueue = []
  }

  /**
   * Get supported music genres
   * @returns {Array} List of supported genres
   */
  getSupportedGenres() {
    return [
      { id: 'ambient', name: 'Ambient', description: 'Atmospheric and ethereal soundscapes' },
      { id: 'electronic', name: 'Electronic', description: 'Synthesized beats and digital sounds' },
      { id: 'jazz', name: 'Jazz', description: 'Complex harmonies and improvisation' },
      { id: 'rock', name: 'Rock', description: 'Guitar-driven energetic music' },
      { id: 'classical', name: 'Classical', description: 'Orchestral and traditional compositions' },
      { id: 'pop', name: 'Pop', description: 'Catchy and mainstream melodies' },
      { id: 'hip-hop', name: 'Hip-Hop', description: 'Rhythmic beats and urban sounds' },
      { id: 'folk', name: 'Folk', description: 'Acoustic and traditional instruments' }
    ]
  }

  /**
   * Get supported moods
   * @returns {Array} List of supported moods
   */
  getSupportedMoods() {
    return [
      { id: 'calm', name: 'Calm', description: 'Peaceful and relaxing' },
      { id: 'energetic', name: 'Energetic', description: 'High energy and upbeat' },
      { id: 'melancholic', name: 'Melancholic', description: 'Sad and contemplative' },
      { id: 'happy', name: 'Happy', description: 'Joyful and uplifting' },
      { id: 'mysterious', name: 'Mysterious', description: 'Dark and enigmatic' },
      { id: 'romantic', name: 'Romantic', description: 'Love and passion' },
      { id: 'epic', name: 'Epic', description: 'Grand and cinematic' },
      { id: 'nostalgic', name: 'Nostalgic', description: 'Reminiscent and wistful' }
    ]
  }

  /**
   * Get sample tracks
   * @returns {Array} List of sample tracks
   */
  getSampleTracks() {
    return this.sampleTracks.map(track => ({
      ...track,
      isDemo: true,
      canPlay: false // Cannot play sample tracks in demo mode
    }))
  }

  /**
   * Validate generation parameters
   * @param {Object} params - Generation parameters
   * @returns {Object} Validation result
   */
  validateGenerationParams(params) {
    const errors = []
    
    if (params.duration && (params.duration < 30 || params.duration > 600)) {
      errors.push('Duration must be between 30 and 600 seconds')
    }
    
    if (params.bpm && (params.bpm < 60 || params.bpm > 200)) {
      errors.push('BPM must be between 60 and 200')
    }
    
    const supportedGenres = this.getSupportedGenres().map(g => g.id)
    if (params.genre && !supportedGenres.includes(params.genre)) {
      errors.push(`Unsupported genre: ${params.genre}`)
    }
    
    const supportedMoods = this.getSupportedMoods().map(m => m.id)
    if (params.mood && !supportedMoods.includes(params.mood)) {
      errors.push(`Unsupported mood: ${params.mood}`)
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    }
  }

  /**
   * Clean up resources
   */
  cleanup() {
    console.log('🧹 Local Music: Cleaning up resources')
    this.cancelGeneration()
  }
}

// Create singleton instance
const musicServiceLocal = new MusicServiceLocal()

// Clean up resources on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    musicServiceLocal.cleanup()
  })
}

export default musicServiceLocal
export { MusicServiceLocal }