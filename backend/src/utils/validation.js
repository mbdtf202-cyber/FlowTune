/**
 * Validation Utilities
 * Common validation functions for API requests
 */

/**
 * Validate music generation parameters
 */
export function validateMusicGeneration(data) {
  const errors = [];

  // Validate prompt
  if (!data.prompt || typeof data.prompt !== 'string') {
    errors.push('Prompt is required and must be a string');
  } else if (data.prompt.trim().length < 3) {
    errors.push('Prompt must be at least 3 characters long');
  } else if (data.prompt.length > 500) {
    errors.push('Prompt must be less than 500 characters');
  }

  // Validate duration
  if (data.duration !== undefined) {
    const duration = parseInt(data.duration);
    if (isNaN(duration) || duration < 5 || duration > 120) {
      errors.push('Duration must be between 5 and 120 seconds');
    }
  }

  // Validate genre
  const validGenres = [
    'electronic', 'ambient', 'classical', 'jazz', 'rock', 'pop',
    'hip-hop', 'techno', 'house', 'experimental', 'cinematic',
    'lo-fi', 'synthwave', 'drum-and-bass'
  ];
  if (data.genre && !validGenres.includes(data.genre.toLowerCase())) {
    errors.push(`Genre must be one of: ${validGenres.join(', ')}`);
  }

  // Validate mood
  const validMoods = [
    'upbeat', 'calm', 'energetic', 'melancholic', 'mysterious',
    'happy', 'sad', 'aggressive', 'peaceful', 'dramatic'
  ];
  if (data.mood && !validMoods.includes(data.mood.toLowerCase())) {
    errors.push(`Mood must be one of: ${validMoods.join(', ')}`);
  }

  // Validate title
  if (data.title && (typeof data.title !== 'string' || data.title.length > 100)) {
    errors.push('Title must be a string with maximum 100 characters');
  }

  // Validate artist
  if (data.artist && (typeof data.artist !== 'string' || data.artist.length > 100)) {
    errors.push('Artist must be a string with maximum 100 characters');
  }

  // Validate royalties
  if (data.royalties) {
    if (!Array.isArray(data.royalties)) {
      errors.push('Royalties must be an array');
    } else {
      let totalPercentage = 0;
      data.royalties.forEach((royalty, index) => {
        if (!royalty.recipient || typeof royalty.recipient !== 'string') {
          errors.push(`Royalty ${index + 1}: recipient is required and must be a string`);
        }
        if (!royalty.percentage || typeof royalty.percentage !== 'number') {
          errors.push(`Royalty ${index + 1}: percentage is required and must be a number`);
        } else if (royalty.percentage < 0 || royalty.percentage > 100) {
          errors.push(`Royalty ${index + 1}: percentage must be between 0 and 100`);
        } else {
          totalPercentage += royalty.percentage;
        }
      });
      
      if (totalPercentage > 100) {
        errors.push('Total royalty percentage cannot exceed 100%');
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

/**
 * Validate music upload parameters
 */
export function validateMusicUpload(data) {
  const errors = [];

  // Validate required fields
  if (!data.title || typeof data.title !== 'string') {
    errors.push('Title is required and must be a string');
  } else if (data.title.length > 100) {
    errors.push('Title must be less than 100 characters');
  }

  if (!data.artist || typeof data.artist !== 'string') {
    errors.push('Artist is required and must be a string');
  } else if (data.artist.length > 100) {
    errors.push('Artist must be less than 100 characters');
  }

  if (!data.audioBuffer) {
    errors.push('Audio buffer is required');
  }

  // Validate optional fields
  if (data.description && (typeof data.description !== 'string' || data.description.length > 1000)) {
    errors.push('Description must be a string with maximum 1000 characters');
  }

  if (data.genre && typeof data.genre !== 'string') {
    errors.push('Genre must be a string');
  }

  // Validate royalties (same as music generation)
  if (data.royalties) {
    if (!Array.isArray(data.royalties)) {
      errors.push('Royalties must be an array');
    } else {
      let totalPercentage = 0;
      data.royalties.forEach((royalty, index) => {
        if (!royalty.recipient || typeof royalty.recipient !== 'string') {
          errors.push(`Royalty ${index + 1}: recipient is required and must be a string`);
        }
        if (!royalty.percentage || typeof royalty.percentage !== 'number') {
          errors.push(`Royalty ${index + 1}: percentage is required and must be a number`);
        } else if (royalty.percentage < 0 || royalty.percentage > 100) {
          errors.push(`Royalty ${index + 1}: percentage must be between 0 and 100`);
        } else {
          totalPercentage += royalty.percentage;
        }
      });
      
      if (totalPercentage > 100) {
        errors.push('Total royalty percentage cannot exceed 100%');
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

/**
 * Validate IPFS hash
 */
export function validateIPFSHash(hash) {
  if (!hash || typeof hash !== 'string') {
    return {
      isValid: false,
      error: 'Hash is required and must be a string'
    };
  }

  // Basic IPFS hash validation (starts with Qm and has correct length)
  const ipfsHashRegex = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;
  if (!ipfsHashRegex.test(hash)) {
    return {
      isValid: false,
      error: 'Invalid IPFS hash format'
    };
  }

  return {
    isValid: true
  };
}

/**
 * Validate Flow address
 */
export function validateFlowAddress(address) {
  if (!address || typeof address !== 'string') {
    return {
      isValid: false,
      error: 'Address is required and must be a string'
    };
  }

  // Flow address validation (starts with 0x and has 16 hex characters)
  const flowAddressRegex = /^0x[a-fA-F0-9]{16}$/;
  if (!flowAddressRegex.test(address)) {
    return {
      isValid: false,
      error: 'Invalid Flow address format'
    };
  }

  return {
    isValid: true
  };
}

/**
 * Validate file upload
 */
export function validateFileUpload(file, allowedTypes = [], maxSize = 50 * 1024 * 1024) {
  const errors = [];

  if (!file) {
    errors.push('File is required');
    return {
      isValid: false,
      errors: errors
    };
  }

  // Validate file type
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
    errors.push(`File type ${file.mimetype} not allowed. Allowed types: ${allowedTypes.join(', ')}`);
  }

  // Validate file size
  if (file.size > maxSize) {
    errors.push(`File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum ${(maxSize / 1024 / 1024).toFixed(2)}MB`);
  }

  // Validate filename
  if (!file.originalname || file.originalname.length > 255) {
    errors.push('Invalid filename');
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

/**
 * Sanitize string input
 */
export function sanitizeString(str, maxLength = 1000) {
  if (typeof str !== 'string') {
    return '';
  }

  return str
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, ''); // Remove potential HTML tags
}

/**
 * Validate pagination parameters
 */
export function validatePagination(page, limit) {
  const errors = [];

  const pageNum = isNaN(parseInt(page)) ? 1 : parseInt(page);
  const limitNum = isNaN(parseInt(limit)) ? 10 : parseInt(limit);

  if (pageNum < 1) {
    errors.push('Page must be greater than 0');
  }

  if (limitNum < 1 || limitNum > 100) {
    errors.push('Limit must be between 1 and 100');
  }

  return {
    isValid: errors.length === 0,
    errors: errors,
    page: Math.max(1, pageNum), // Ensure page is at least 1 for return value
    limit: Math.max(1, Math.min(100, limitNum)) // Ensure limit is within bounds for return value
  };
}

/**
 * Validate search parameters
 */
export function validateSearch(query, filters = {}) {
  const errors = [];

  // Validate query
  if (query && (typeof query !== 'string' || query.length < 2)) {
    errors.push('Search query must be at least 2 characters long');
  }

  // Validate filters
  if (filters.genre && typeof filters.genre !== 'string') {
    errors.push('Genre filter must be a string');
  }

  if (filters.artist && typeof filters.artist !== 'string') {
    errors.push('Artist filter must be a string');
  }

  if (filters.minDuration && (isNaN(parseInt(filters.minDuration)) || parseInt(filters.minDuration) < 0)) {
    errors.push('Minimum duration must be a positive number');
  }

  if (filters.maxDuration && (isNaN(parseInt(filters.maxDuration)) || parseInt(filters.maxDuration) < 0)) {
    errors.push('Maximum duration must be a positive number');
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
}