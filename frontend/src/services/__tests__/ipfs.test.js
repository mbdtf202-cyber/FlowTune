import { describe, it, expect, vi, beforeEach } from 'vitest'
import ipfsService from '../ipfs'

// Mock dependencies
vi.mock('../ipfsLocal.js', () => ({
  default: {
    uploadFile: vi.fn().mockResolvedValue({ hash: 'QmTest123' }),
    uploadMetadata: vi.fn().mockResolvedValue({ hash: 'QmMeta123' }),
    getFile: vi.fn().mockResolvedValue(new Blob(['test'])),
    getFileMetadata: vi.fn().mockResolvedValue({ title: 'Test' })
  }
}))

// Mock fetch globally
global.fetch = vi.fn()

describe('IPFS Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch.mockClear()
  })

  describe('Basic functionality', () => {
    it('should be instantiated correctly', () => {
      expect(ipfsService).toBeDefined()
      expect(ipfsService.gateway).toBeDefined()
    })

    it('should have required methods', () => {
      expect(typeof ipfsService.uploadFile).toBe('function')
      expect(typeof ipfsService.uploadMetadata).toBe('function')
      expect(typeof ipfsService.getFile).toBe('function')
      expect(typeof ipfsService.getFileMetadata).toBe('function')
      expect(typeof ipfsService.getIPFSUrl).toBe('function')
    })
  })

  describe('getIPFSUrl', () => {
    it('should generate correct IPFS URL', () => {
      const hash = 'QmTest123'
      const url = ipfsService.getIPFSUrl(hash)
      
      expect(url).toBe(`https://gateway.pinata.cloud/ipfs/${hash}`)
    })
  })

  describe('extractHashFromUrl', () => {
    it('should extract hash from IPFS URL', () => {
      const url = 'https://gateway.pinata.cloud/ipfs/QmTest123'
      const hash = ipfsService.extractHashFromUrl(url)
      
      expect(hash).toBe('QmTest123')
    })

    it('should handle invalid URLs', () => {
      const url = 'invalid-url'
      const hash = ipfsService.extractHashFromUrl(url)
      
      expect(hash).toBeNull()
    })
  })


})