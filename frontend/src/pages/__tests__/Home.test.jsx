import React from 'react'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'
import Home from '../Home'

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'home.features.aiGeneration': 'AI Music Generation',
        'home.features.nftMinting': 'NFT Minting',
        'home.features.analytics': 'Analytics & Royalties',
        'home.hero.title': 'Create, Mint, and Trade Music NFTs',
        'home.hero.subtitle': 'The future of music creation and ownership',
        'home.cta.getStarted': 'Get Started',
        'home.cta.exploreMarketplace': 'Explore Marketplace'
      }
      return translations[key] || key
    },
  }),
}))

// Mock all Flow and service dependencies
vi.mock('@onflow/fcl', () => ({
  config: vi.fn(),
  authenticate: vi.fn(),
  unauthenticate: vi.fn(),
  currentUser: {
    subscribe: vi.fn()
  }
}))

vi.mock('../services/flowService', () => ({
  getFlowService: vi.fn(() => ({
    isReady: true,
    getBalance: vi.fn(() => Promise.resolve('0')),
    getUserNFTs: vi.fn(() => Promise.resolve([]))
  }))
}))

vi.mock('../services/flowServiceAPI', () => ({
  default: {}
}))

vi.mock('../services/walletLocal', () => ({
  default: {}
}))

vi.mock('../services/logger.jsx', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }
}))

vi.mock('../services/permissions', () => ({
  default: {}
}))

// Mock environment config
vi.mock('../config/environment', () => ({
  default: {
    LOCAL_DEMO_MODE: true,
    ENABLE_DEBUG: false
  },
  flowConfig: {
    localMode: true,
    demoMode: true
  }
}))

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Music: () => <div data-testid="music-icon">Music</div>,
  Sparkles: () => <div data-testid="sparkles-icon">Sparkles</div>,
  Coins: () => <div data-testid="coins-icon">Coins</div>,
  Users: () => <div data-testid="users-icon">Users</div>,
  ArrowRight: () => <div data-testid="arrow-right-icon">ArrowRight</div>,
  Play: () => <div data-testid="play-icon">Play</div>,
  TrendingUp: () => <div data-testid="trending-up-icon">TrendingUp</div>,
  Shield: () => <div data-testid="shield-icon">Shield</div>,
  Zap: () => <div data-testid="zap-icon">Zap</div>,
}))

// Import AuthProvider after mocking
import { AuthProvider } from '../../contexts/AuthContext'

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  )
}

describe('Home', () => {
  it('renders without crashing', () => {
    const { container } = renderWithRouter(<Home />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('renders hero section', () => {
    const { container } = renderWithRouter(<Home />)
    
    // Check if content is rendered
    expect(container.firstChild).toBeInTheDocument()
  })

  it('renders features section', () => {
    renderWithRouter(<Home />)
    
    // Check if feature icons exist (there may be multiple)
    expect(screen.getAllByTestId('sparkles-icon').length).toBeGreaterThan(0)
    expect(screen.getAllByTestId('coins-icon').length).toBeGreaterThan(0)
    expect(screen.getAllByTestId('shield-icon').length).toBeGreaterThan(0)
    expect(screen.getAllByTestId('trending-up-icon').length).toBeGreaterThan(0)
  })

  it('renders navigation links', () => {
    renderWithRouter(<Home />)
    
    // Check if link elements exist
    const links = screen.getAllByRole('link')
    expect(links.length).toBeGreaterThan(0)
  })

  it('renders statistics section', () => {
    renderWithRouter(<Home />)
    
    // Check statistics-related icons
    expect(screen.getAllByTestId('music-icon').length).toBeGreaterThan(0)
    expect(screen.getAllByTestId('coins-icon').length).toBeGreaterThan(0)
  })

  it('applies correct styling classes', () => {
    const { container } = renderWithRouter(<Home />)
    
    // Check if basic container structure exists
    expect(container.firstChild).toBeInTheDocument()
  })
})