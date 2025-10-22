/**
 * MusicService Local - Local simulation version
 * For demo purposes, provides simulated music data and functionality
 */

class MusicServiceLocal {
  constructor() {
    this.mockTracks = [
      {
        id: '1',
        title: 'Electronic Dreams',
        artist: 'AI Composer',
        album: 'Digital Soundscapes',
        duration: 225, // 3:45
        genre: 'Electronic',
        audioUrl: '/demo-audio/electronic-dreams.mp3',
        coverImage: '/demo-images/electronic-dreams.jpg',
        waveform: this.generateMockWaveform(),
        isPlaying: false,
        currentTime: 0,
        metadata: {
          bpm: 128,
          key: 'C Major',
          energy: 0.8,
          danceability: 0.9,
          valence: 0.7
        },
        nft: {
          tokenId: '1',
          price: '10.5',
          currency: 'FLOW',
          owner: '0x1234567890abcdef'
        }
      },
      {
        id: '2',
        title: 'Ambient Serenity',
        artist: 'Digital Harmony',
        album: 'Peaceful Moments',
        duration: 320, // 5:20
        genre: 'Ambient',
        audioUrl: '/demo-audio/ambient-serenity.mp3',
        coverImage: '/demo-images/ambient-serenity.jpg',
        waveform: this.generateMockWaveform(),
        isPlaying: false,
        currentTime: 0,
        metadata: {
          bpm: 60,
          key: 'A Minor',
          energy: 0.3,
          danceability: 0.2,
          valence: 0.8
        },
        nft: {
          tokenId: '2',
          price: '8.0',
          currency: 'FLOW',
          owner: '0xabcdef1234567890'
        }
      },
      {
        id: '3',
        title: 'Jazz Fusion',
        artist: 'AI Jazz Ensemble',
        album: 'Modern Improvisations',
        duration: 270, // 4:30
        genre: 'Jazz',
        audioUrl: '/demo-audio/jazz-fusion.mp3',
        coverImage: '/demo-images/jazz-fusion.jpg',
        waveform: this.generateMockWaveform(),
        isPlaying: false,
        currentTime: 0,
        metadata: {
          bpm: 140,
          key: 'Bb Major',
          energy: 0.7,
          danceability: 0.6,
          valence: 0.9
        },
        nft: {
          tokenId: '3',
          price: '15.0',
          currency: 'FLOW',
          owner: '0x9876543210fedcba'
        }
      },
      {
        id: '4',
        title: 'Synthwave Nights',
        artist: 'Retro AI',
        album: 'Neon Dreams',
        duration: 195, // 3:15
        genre: 'Synthwave',
        audioUrl: '/demo-audio/synthwave-nights.mp3',
        coverImage: '/demo-images/synthwave-nights.jpg',
        waveform: this.generateMockWaveform(),
        isPlaying: false,
        currentTime: 0,
        metadata: {
          bpm: 120,
          key: 'D Minor',
          energy: 0.9,
          danceability: 0.8,
          valence: 0.6
        },
        nft: {
          tokenId: '4',
          price: '12.0',
          currency: 'FLOW',
          owner: '0x1234567890abcdef'
        }
      },
      {
        id: '5',
        title: 'Classical Reimagined',
        artist: 'AI Orchestra',
        album: 'Digital Symphony',
        duration: 420, // 7:00
        genre: 'Classical',
        audioUrl: '/demo-audio/classical-reimagined.mp3',
        coverImage: '/demo-images/classical-reimagined.jpg',
        waveform: this.generateMockWaveform(),
        isPlaying: false,
        currentTime: 0,
        metadata: {
          bpm: 90,
          key: 'E Major',
          energy: 0.6,
          danceability: 0.3,
          valence: 0.9
        },
        nft: {
          tokenId: '5',
          price: '20.0',
          currency: 'FLOW',
          owner: '0xfedcba0987654321'
        }
      }
    ];

    this.mockPlaylists = [
      {
        id: 'playlist-1',
        name: 'AI Favorites',
        description: 'Best AI-generated music tracks',
        tracks: ['1', '2', '3'],
        coverImage: '/demo-images/playlist-ai-favorites.jpg',
        isPublic: true,
        owner: '0x1234567890abcdef',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-20')
      },
      {
        id: 'playlist-2',
        name: 'Chill Vibes',
        description: 'Relaxing ambient and chill tracks',
        tracks: ['2', '5'],
        coverImage: '/demo-images/playlist-chill-vibes.jpg',
        isPublic: true,
        owner: '0x1234567890abcdef',
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-18')
      },
      {
        id: 'playlist-3',
        name: 'Electronic Energy',
        description: 'High-energy electronic music',
        tracks: ['1', '4'],
        coverImage: '/demo-images/playlist-electronic-energy.jpg',
        isPublic: false,
        owner: '0x1234567890abcdef',
        createdAt: new Date('2024-01-05'),
        updatedAt: new Date('2024-01-22')
      }
    ];

    this.currentTrack = null;
    this.isPlaying = false;
    this.currentPlaylist = null;
  }

  // Generate mock waveform data
  generateMockWaveform() {
    const points = 100;
    const waveform = [];
    for (let i = 0; i < points; i++) {
      waveform.push(Math.random() * 0.8 + 0.1);
    }
    return waveform;
  }

  // Get all music tracks
  async getAllTracks() {
    console.log('🎵 Getting mock music tracks...');
    await new Promise(resolve => setTimeout(resolve, 300));
    return this.mockTracks;
  }

  // Get single music track
  async getTrack(trackId) {
    console.log(`🎵 Getting mock track: ${trackId}`);
    await new Promise(resolve => setTimeout(resolve, 200));
    return this.mockTracks.find(track => track.id === trackId) || null;
  }

  // Search music tracks
  async searchTracks(query) {
    console.log(`🔍 Searching mock tracks: ${query}`);
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const lowerQuery = query.toLowerCase();
    return this.mockTracks.filter(track => 
      track.title.toLowerCase().includes(lowerQuery) ||
      track.artist.toLowerCase().includes(lowerQuery) ||
      track.genre.toLowerCase().includes(lowerQuery) ||
      track.album.toLowerCase().includes(lowerQuery)
    );
  }

  // Filter music by genre
  async getTracksByGenre(genre) {
    console.log(`🎼 Getting tracks by genre: ${genre}`);
    await new Promise(resolve => setTimeout(resolve, 300));
    return this.mockTracks.filter(track => 
      track.genre.toLowerCase() === genre.toLowerCase()
    );
  }

  // Get recommended music
  async getRecommendedTracks(limit = 5) {
    console.log('✨ Getting recommended tracks...');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Random recommendation
    const shuffled = [...this.mockTracks].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, limit);
  }

  // Get trending music
  async getTrendingTracks(limit = 10) {
    console.log('🔥 Getting trending tracks...');
    await new Promise(resolve => setTimeout(resolve, 400));
    
    // Sort by energy value as popularity
    const sorted = [...this.mockTracks].sort((a, b) => 
      b.metadata.energy - a.metadata.energy
    );
    return sorted.slice(0, limit);
  }

  // Get playlists
  async getPlaylists() {
    console.log('📋 Getting mock playlists...');
    await new Promise(resolve => setTimeout(resolve, 300));
    return this.mockPlaylists;
  }

  // Get single playlist
  async getPlaylist(playlistId) {
    console.log(`📋 Getting mock playlist: ${playlistId}`);
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const playlist = this.mockPlaylists.find(p => p.id === playlistId);
    if (!playlist) return null;

    // Add complete music information
    const tracksWithDetails = playlist.tracks.map(trackId => 
      this.mockTracks.find(track => track.id === trackId)
    ).filter(Boolean);

    return {
      ...playlist,
      tracks: tracksWithDetails
    };
  }

  // Create playlist
  async createPlaylist(playlistData) {
    console.log('📋 Creating mock playlist...');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newPlaylist = {
      id: `playlist_${Date.now()}`,
      name: playlistData.name,
      description: playlistData.description || '',
      tracks: playlistData.tracks || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPublic: playlistData.isPublic || false,
      creator: 'current_user'
    };
    
    this.mockPlaylists.push(newPlaylist);
    return newPlaylist;
  }

  // Update playlist
  async updatePlaylist(playlistId, updates) {
    console.log(`📋 Updating mock playlist: ${playlistId}`);
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const playlistIndex = this.mockPlaylists.findIndex(p => p.id === playlistId);
    if (playlistIndex === -1) {
      throw new Error('Playlist not found');
    }
    
    this.mockPlaylists[playlistIndex] = {
      ...this.mockPlaylists[playlistIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    return this.mockPlaylists[playlistIndex];
  }

  // Delete playlist
  async deletePlaylist(playlistId) {
    console.log(`📋 Deleting mock playlist: ${playlistId}`);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const playlistIndex = this.mockPlaylists.findIndex(p => p.id === playlistId);
    if (playlistIndex === -1) {
      throw new Error('Playlist not found');
    }
    
    this.mockPlaylists.splice(playlistIndex, 1);
    return { success: true };
  }

  // Play music
  async playTrack(trackId) {
    console.log(`▶️ Playing mock track: ${trackId}`);
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Stop currently playing music
    if (this.currentTrack && this.currentTrack.id !== trackId) {
      this.currentTrack.isPlaying = false;
    }
    
    // Set new playing music
    const track = this.mockTracks.find(t => t.id === trackId);
    if (track) {
      track.isPlaying = true;
      track.currentTime = 0;
      this.currentTrack = track;
      return { success: true, track };
    }
    
    throw new Error('Track not found');
  }

  // Pause music
  async pauseTrack() {
    console.log('⏸️ Pausing current track...');
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (this.currentTrack) {
      this.currentTrack.isPlaying = false;
      return { success: true, track: this.currentTrack };
    }
    
    throw new Error('No track currently playing');
  }

  // Stop music
  async stopTrack() {
    console.log('⏹️ Stopping current track...');
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (this.currentTrack) {
      this.currentTrack.isPlaying = false;
      this.currentTrack.currentTime = 0;
      const stoppedTrack = this.currentTrack;
      this.currentTrack = null;
      return { success: true, track: stoppedTrack };
    }
    
    throw new Error('No track currently playing');
  }

  // Get current playback state
  getCurrentPlaybackState() {
    return {
      currentTrack: this.currentTrack,
      isPlaying: this.currentTrack?.isPlaying || false,
      currentTime: this.currentTrack?.currentTime || 0,
      duration: this.currentTrack?.duration || 0
    };
  }

  // Simulate music upload
  async uploadTrack(trackData) {
    console.log('📤 Uploading mock track...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const newTrack = {
      id: `track_${Date.now()}`,
      title: trackData.title,
      artist: trackData.artist || 'Unknown Artist',
      album: trackData.album || 'Unknown Album',
      genre: trackData.genre || 'Unknown',
      duration: trackData.duration || Math.floor(Math.random() * 300) + 120,
      fileUrl: URL.createObjectURL(trackData.file),
      coverUrl: trackData.coverUrl || '/images/default-cover.jpg',
      uploadedAt: new Date().toISOString(),
      isPlaying: false,
      currentTime: 0,
      metadata: {
        bitrate: 320,
        sampleRate: 44100,
        channels: 2,
        format: 'mp3',
        energy: Math.random(),
        valence: Math.random(),
        danceability: Math.random(),
        acousticness: Math.random(),
        instrumentalness: Math.random(),
        liveness: Math.random(),
        speechiness: Math.random()
      },
      waveform: this.generateMockWaveform()
    };
    
    this.mockTracks.unshift(newTrack);
    return newTrack;
  }

  // Get music statistics
  async getMusicStats() {
    console.log('📊 Getting mock music stats...');
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      totalTracks: this.mockTracks.length,
      totalPlaylists: this.mockPlaylists.length,
      totalDuration: this.mockTracks.reduce((sum, track) => sum + track.duration, 0),
      genreDistribution: this.getGenreDistribution(),
      averageTrackLength: Math.floor(
        this.mockTracks.reduce((sum, track) => sum + track.duration, 0) / this.mockTracks.length
      )
    };
  }

  // Get genre distribution
  getGenreDistribution() {
    const distribution = {};
    this.mockTracks.forEach(track => {
      distribution[track.genre] = (distribution[track.genre] || 0) + 1;
    });
    return distribution;
  }
}

// Create singleton instance
let musicServiceLocalInstance = null;

export const getMusicServiceLocal = () => {
  if (!musicServiceLocalInstance) {
    musicServiceLocalInstance = new MusicServiceLocal();
  }
  return musicServiceLocalInstance;
};

export default getMusicServiceLocal();