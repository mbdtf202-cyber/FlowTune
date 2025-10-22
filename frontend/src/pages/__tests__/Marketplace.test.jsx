import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'
import Marketplace from '../Marketplace'

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'marketplace.all': 'All',
        'marketplace.newestFirst': 'Newest First',
        'marketplace.oldestFirst': 'Oldest First',
        'marketplace.priceLowToHigh': 'Price: Low to High',
        'marketplace.priceHighToLow': 'Price: High to Low',
        'marketplace.mostPopular': 'Most Popular',
        'marketplace.searchPlaceholder': 'Search music NFTs...',
        'marketplace.noResults': 'No NFTs found',
        'marketplace.loading': 'Loading...'
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

vi.mock('../services/cache', () => ({
  cache: {
    get: vi.fn(),
    set: vi.fn(),
    clear: vi.fn()
  }
}))

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: [] })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} }))
  }
}))

vi.mock('../hooks/useWebSocket', () => ({
  useRealTimeData: () => ({
    marketUpdates: null,
    isConnected: true
  })
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
  Search: () => <div data-testid="search-icon">Search</div>,
  Filter: () => <div data-testid="filter-icon">Filter</div>,
  Play: () => <div data-testid="play-icon">Play</div>,
  Pause: () => <div data-testid="pause-icon">Pause</div>,
  ShoppingCart: () => <div data-testid="shopping-cart-icon">ShoppingCart</div>,
  Heart: () => <div data-testid="heart-icon">Heart</div>,
  Music: () => <div data-testid="music-icon">Music</div>,
  Clock: () => <div data-testid="clock-icon">Clock</div>,
  User: () => <div data-testid="user-icon">User</div>,
  TrendingUp: () => <div data-testid="trending-up-icon">TrendingUp</div>,
  Grid: () => <div data-testid="grid-icon">Grid</div>,
  List: () => <div data-testid="list-icon">List</div>,
  SortAsc: () => <div data-testid="sort-asc-icon">SortAsc</div>,
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

describe('Marketplace', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    const { container } = renderWithRouter(<Marketplace />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('renders loading state initially', () => {
    renderWithRouter(<Marketplace />)
    
    // Check loading state
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('has proper page structure', () => {
    const { container } = renderWithRouter(<Marketplace />)
    
    // Check page has basic structure
    expect(container.querySelector('.min-h-screen')).toBeInTheDocument()
  })

  it('shows loading spinner', () => {
    const { container } = renderWithRouter(<Marketplace />)
    
    // Check loading animation
    expect(container.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('renders with proper styling classes', () => {
    const { container } = renderWithRouter(<Marketplace />)
    
    // Check if background styling exists
    expect(container.querySelector('.bg-gray-50')).toBeInTheDocument()
  })

  it('applies correct styling classes', () => {
    const { container } = renderWithRouter(<Marketplace />)
    
    // Check if basic container structure exists
    expect(container.firstChild).toBeInTheDocument()
  })
})