import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock FCL
vi.mock('@onflow/fcl', () => ({
  config: vi.fn(),
  authenticate: vi.fn(),
  unauthenticate: vi.fn(),
  currentUser: {
    subscribe: vi.fn()
  },
  query: vi.fn(),
  mutate: vi.fn(),
  send: vi.fn(),
  decode: vi.fn()
}))

// Mock environment config
vi.mock('../../config/environment', () => ({
  default: {
    ENVIRONMENT: 'test',
    API_BASE_URL: 'http://localhost:3002/api',
    FLOW_NETWORK: 'testnet'
  },
  flowConfig: {
    network: 'testnet',
    accessNode: 'https://rest-testnet.onflow.org',
    discoveryWallet: 'https://fcl-discovery.onflow.org/testnet/authn',
    localMode: false,
    contracts: {
      FlowTuneMarket: '0x123',
      FlowTuneNFT: '0x456'
    }
  }
}))

// Mock fetch globally
global.fetch = vi.fn()

// Import after mocks
const { getFlowService } = await import('../flowService')

describe('Flow Service', () => {
  let flowService

  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch.mockClear()
    
    // Mock successful network response
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: 'ok' })
    })
    
    flowService = getFlowService()
  })

  describe('Basic functionality', () => {
    it('should be instantiated correctly', () => {
      expect(flowService).toBeDefined()
    })

    it('should have required methods', () => {
      expect(typeof flowService.init).toBe('function')
      expect(typeof flowService.authenticate).toBe('function')
      expect(typeof flowService.unauthenticate).toBe('function')
      expect(typeof flowService.getCurrentUser).toBe('function')
      expect(typeof flowService.getBalance).toBe('function')
      expect(typeof flowService.getUserNFTs).toBe('function')
      expect(typeof flowService.getMarketNFTs).toBe('function')
    })
  })

  describe('init', () => {
    it('should have init method', () => {
      expect(typeof flowService.init).toBe('function')
    })
  })

  describe('authenticate', () => {
    it('should handle authentication', async () => {
      const mockUser = { addr: '0x123', loggedIn: true }
      const fcl = await import('@onflow/fcl')
      fcl.authenticate.mockResolvedValue(mockUser)

      const result = await flowService.authenticate()
      expect(result).toBeDefined()
    })
  })

  describe('unauthenticate', () => {
    it('should handle unauthentication', async () => {
      const fcl = await import('@onflow/fcl')
      fcl.unauthenticate.mockResolvedValue()

      await flowService.unauthenticate()
      expect(fcl.unauthenticate).toHaveBeenCalled()
    })
  })

  describe('getCurrentUser', () => {
    it('should get current user', () => {
      const result = flowService.getCurrentUser()
      expect(result).toBeDefined()
    })
  })

  describe('getBalance', () => {
    it('should get user balance', async () => {
      const mockBalance = '100.0'
      const fcl = await import('@onflow/fcl')
      fcl.query.mockResolvedValue(mockBalance)

      const result = await flowService.getBalance('0x123')
      expect(result).toBeDefined()
    })
  })

  describe('getUserNFTs', () => {
    it('should get user NFTs', async () => {
      const mockNFTs = [{ id: 1, title: 'Test NFT' }]
      const fcl = await import('@onflow/fcl')
      fcl.query.mockResolvedValue(mockNFTs)

      const result = await flowService.getUserNFTs('0x123')
      expect(result).toBeDefined()
    })
  })

  describe('getMarketNFTs', () => {
    it('should get market NFTs', async () => {
      const mockNFTs = [{ id: 1, title: 'Market NFT' }]
      const fcl = await import('@onflow/fcl')
      fcl.query.mockResolvedValue(mockNFTs)

      const result = await flowService.getMarketNFTs()
      expect(result).toBeDefined()
    })
  })
})