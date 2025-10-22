/**
 * Music service
 * Provides music generation, upload, management and other functions
 */

import apiService from './api';

class MusicService {
  constructor() {
    this.baseUrl = '/api/music';
  }

  /**
   * Generate music
   */
  async generateMusic(params) {
    try {
      const response = await apiService.post(`${this.baseUrl}/generate`, params);
      return response;
    } catch (error) {
      console.error('Music generation failed:', error);
      throw error;
    }
  }

  /**
   * Upload music file
   */
  async uploadMusic(file, metadata = {}) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('metadata', JSON.stringify(metadata));

      const response = await apiService.post(`${this.baseUrl}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response;
    } catch (error) {
      console.error('Music upload failed:', error);
      throw error;
    }
  }

  /**
   * Get music list
   */
  async getMusicList(params = {}) {
    try {
      const response = await apiService.get(`${this.baseUrl}/list`, { params });
      return response;
    } catch (error) {
      console.error('Failed to get music list:', error);
      throw error;
    }
  }

  /**
   * Get music details
   */
  async getMusicDetail(id) {
    try {
      const response = await apiService.get(`${this.baseUrl}/${id}`);
      return response;
    } catch (error) {
      console.error('Failed to get music details:', error);
      throw error;
    }
  }

  /**
   * Delete music
   */
  async deleteMusic(id) {
    try {
      const response = await apiService.delete(`${this.baseUrl}/${id}`);
      return response;
    } catch (error) {
      console.error('Failed to delete music:', error);
      throw error;
    }
  }

  /**
   * Update music information
   */
  async updateMusic(id, data) {
    try {
      const response = await apiService.put(`${this.baseUrl}/${id}`, data);
      return response;
    } catch (error) {
      console.error('Failed to update music information:', error);
      throw error;
    }
  }

  /**
   * Search music
   */
  async searchMusic(query, filters = {}) {
    try {
      const response = await apiService.get(`${this.baseUrl}/search`, {
        params: { query, ...filters }
      });
      return response;
    } catch (error) {
      console.error('Music search failed:', error);
      throw error;
    }
  }

  /**
   * Get music analysis data
   */
  async getMusicAnalysis(id) {
    try {
      const response = await apiService.get(`${this.baseUrl}/${id}/analysis`);
      return response;
    } catch (error) {
      console.error('Failed to get music analysis:', error);
      throw error;
    }
  }

  /**
   * Generate music preview
   */
  async generatePreview(params) {
    try {
      const response = await apiService.post(`${this.baseUrl}/preview`, params);
      return response;
    } catch (error) {
      console.error('Failed to generate music preview:', error);
      throw error;
    }
  }

  /**
   * Get music genres list
   */
  async getGenres() {
    try {
      const response = await apiService.get(`${this.baseUrl}/genres`);
      return response;
    } catch (error) {
      console.error('Failed to get music genres:', error);
      throw error;
    }
  }

  /**
   * Get music tags
   */
  async getTags() {
    try {
      const response = await apiService.get(`${this.baseUrl}/tags`);
      return response;
    } catch (error) {
      console.error('Failed to get music tags:', error);
      throw error;
    }
  }

  /**
   * Favorite music
   */
  async favoriteMusic(id) {
    try {
      const response = await apiService.post(`${this.baseUrl}/${id}/favorite`);
      return response;
    } catch (error) {
      console.error('Failed to favorite music:', error);
      throw error;
    }
  }

  /**
   * Unfavorite music
   */
  async unfavoriteMusic(id) {
    try {
      const response = await apiService.delete(`${this.baseUrl}/${id}/favorite`);
      return response;
    } catch (error) {
      console.error('Failed to unfavorite music:', error);
      throw error;
    }
  }

  /**
   * Get user's favorite music
   */
  async getFavoriteMusic(params = {}) {
    try {
      const response = await apiService.get(`${this.baseUrl}/favorites`, { params });
      return response;
    } catch (error) {
      console.error('Failed to get favorite music:', error);
      throw error;
    }
  }

  /**
   * Play music
   */
  async playMusic(id) {
    try {
      const response = await apiService.post(`${this.baseUrl}/${id}/play`);
      return response;
    } catch (error) {
      console.error('Failed to play music:', error);
      throw error;
    }
  }

  /**
   * Get music play statistics
   */
  async getPlayStats(id) {
    try {
      const response = await apiService.get(`${this.baseUrl}/${id}/stats`);
      return response;
    } catch (error) {
      console.error('Failed to get play statistics:', error);
      throw error;
    }
  }
}

// Create singleton instance
export const musicService = new MusicService();
export default musicService;