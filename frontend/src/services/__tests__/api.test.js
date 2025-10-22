import { describe, it, expect, vi, beforeEach } from 'vitest'
import apiService from '../api'

// Mock dependencies
vi.mock('../ipfs', () => ({
  default: {
    uploadFile: vi.fn(),
    uploadMetadata: vi.fn()
  }
}))

vi.mock('../blockchain', () => ({
  default: {
    mintNFT: vi.fn()
  }
}))

vi.mock('../flowService', () => ({
  default: {
    authenticate: vi.fn(),
    getCurrentUser: vi.fn()
  }
}))

vi.mock('../logger.jsx', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}))

// Mock fetch globally
global.fetch = vi.fn()

// Mock AudioContext
global.AudioContext = vi.fn().mockImplementation(() => ({
  createOscillator: vi.fn(),
  createGain: vi.fn(),
  destination: {}
}))
global.webkitAudioContext = global.AudioContext

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch.mockClear()
  })

  describe('Basic functionality', () => {
    it('should be instantiated correctly', () => {
      expect(apiService).toBeDefined()
      expect(apiService.baseURL).toBeDefined()
    })

    it('should have required methods', () => {
      expect(typeof apiService.generateMusic).toBe('function')
      expect(typeof apiService.uploadToIPFS).toBe('function')
      expect(typeof apiService.getMarketNFTs).toBe('function')
      expect(typeof apiService.getUserNFTs).toBe('function')
      expect(typeof apiService.mintMusicNFT).toBe('function')
    })
  })

  describe('generateMusic', () => {
    it('should have generateMusic method', () => {
      expect(typeof apiService.generateMusic).toBe('function')
    })
  })

  describe('getMarketNFTs', () => {
    it('should fetch market NFTs', async () => {
      const mockNFTs = [{ id: 1, title: 'Test Song' }]
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ nfts: mockNFTs })
      })

      const result = await apiService.getMarketNFTs()
      expect(result).toBeDefined()
    })
  })

  describe('getUserNFTs', () => {
    it('should fetch user NFTs', async () => {
      const mockNFTs = [{ id: 1, title: 'User Song' }]
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ nfts: mockNFTs })
      })

      const result = await apiService.getUserNFTs('0x123')
      expect(result).toBeDefined()
    })
  })

  describe('healthCheck', () => {
    it('should perform health check', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ok' })
      })

      const result = await apiService.healthCheck()
      expect(result).toBeDefined()
    })
  })
})