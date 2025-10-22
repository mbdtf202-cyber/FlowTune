import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'
import Create from '../Create'
import { AuthProvider } from '../../contexts/AuthContext'

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: 'en' }
  })
}))

vi.mock('@onflow/fcl', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    currentUser: {
      subscribe: vi.fn((callback) => {
        callback({ addr: null, loggedIn: false })
        return { unsubscribe: vi.fn() }
      })
    },
    authenticate: vi.fn(),
    unauthenticate: vi.fn(),
    config: vi.fn()
  }
})

vi.mock('../../services/flowService', () => ({
  default: {
    isConfigured: vi.fn(() => true),
    getCurrentUser: vi.fn(() => Promise.resolve(null)),
    authenticate: vi.fn(() => Promise.resolve()),
    unauthenticate: vi.fn(() => Promise.resolve()),
    getUserBalance: vi.fn(() => Promise.resolve('0.0')),
    getUserNFTs: vi.fn(() => Promise.resolve([])),
    mintNFT: vi.fn(() => Promise.resolve({ transactionId: 'test-tx' }))
  }
}))

vi.mock('../../services/flowServiceAPI', () => ({
  default: {
    getAccountBalance: vi.fn(() => Promise.resolve('0.0')),
    getAccountNFTs: vi.fn(() => Promise.resolve([])),
    mintNFT: vi.fn(() => Promise.resolve({ transactionId: 'test-tx' }))
  }
}))

vi.mock('../../services/walletLocal', () => ({
  default: {
    isConnected: vi.fn(() => false),
    connect: vi.fn(() => Promise.resolve()),
    disconnect: vi.fn(() => Promise.resolve()),
    getBalance: vi.fn(() => Promise.resolve('0.0'))
  }
}))

vi.mock('../../utils/logger.jsx', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }
}))

vi.mock('../../utils/permissions', () => ({
  checkPermissions: vi.fn(() => Promise.resolve(true)),
  requestPermissions: vi.fn(() => Promise.resolve(true))
}))

vi.mock('../../services/api', () => ({
  default: {
    uploadToIPFS: vi.fn(() => Promise.resolve({ ipfsHash: 'test-hash' })),
    mintNFT: vi.fn(() => Promise.resolve({ transactionId: 'test-tx' })),
    generateMusic: vi.fn(() => Promise.resolve({ audioUrl: 'test-audio-url' }))
  }
}))

vi.mock('../../components/Notification', () => ({
  useNotification: () => ({
    addNotification: vi.fn(),
    NotificationContainer: () => <div data-testid="notification-container" />
  })
}))

vi.mock('../../components/AudioPlayer', () => ({
  default: function MockAudioPlayer() {
    return <div data-testid="audio-player">Audio Player</div>
  }
}))

vi.mock('../../components/MusicGenerationForm', () => ({
  default: function MockMusicGenerationForm({ onGenerate }) {
    return (
      <div data-testid="music-generation-form">
        <button onClick={() => onGenerate({ prompt: 'test prompt' })}>
          Generate Music
        </button>
      </div>
    )
  }
}))

vi.mock('../../components/UploadProgress', () => ({
  default: function MockUploadProgress({ progress }) {
    return <div data-testid="upload-progress">Progress: {progress}%</div>
  }
}))

vi.mock('../../components/ForteActionsWorkflow', () => ({
  default: function MockForteActionsWorkflow() {
    return <div data-testid="forte-actions-workflow">Forte Actions</div>
  }
}))

vi.mock('../../components/AuthErrorModal', () => ({
  default: function MockAuthErrorModal({ isOpen, onClose }) {
    return isOpen ? (
      <div data-testid="auth-error-modal">
        <button onClick={onClose}>Close</button>
      </div>
    ) : null
  }
}))

vi.mock('../../config/environment', () => ({
  default: {
    ERROR_REPORTING_ENABLED: false,
    API_BASE_URL: 'http://localhost:3000',
    FLOW_NETWORK: 'testnet'
  },
  getCurrentEnvironment: vi.fn(() => 'development'),
  isProduction: vi.fn(() => false),
  isDevelopment: vi.fn(() => true),
  logConfig: {
    enabled: true,
    level: 'info',
    maxLogs: 1000
  },
  flowConfig: {
    localMode: false,
    network: 'testnet',
    accessNode: 'https://rest-testnet.onflow.org'
  }
}))

vi.mock('lucide-react', () => ({
  Sparkles: () => <div data-testid="sparkles-icon" />,
  Upload: () => <div data-testid="upload-icon" />,
  Music: () => <div data-testid="music-icon" />,
  Image: () => <div data-testid="image-icon" />,
  Loader: () => <div data-testid="loader-icon" />,
  Coins: () => <div data-testid="coins-icon" />,
  Zap: () => <div data-testid="zap-icon" />
}))

// Helper function to render with router and auth context
const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  )
}

describe('Create', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    const { container } = renderWithRouter(<Create />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('renders connect wallet interface when not authenticated', () => {
    renderWithRouter(<Create />)
    
    // Check connect wallet interface
    expect(screen.getByText('Connect Your Wallet')).toBeInTheDocument()
    expect(screen.getByText('Connect Wallet')).toBeInTheDocument()
  })

  it('renders music icon in connect wallet interface', () => {
    renderWithRouter(<Create />)
    
    // Check music icon
    expect(screen.getByTestId('music-icon')).toBeInTheDocument()
  })

  it('shows error details button when error present', () => {
    renderWithRouter(<Create />)
    
    // Check error details button
    expect(screen.getByText('View Details')).toBeInTheDocument()
  })

  it('has connect wallet button', () => {
    renderWithRouter(<Create />)
    
    // Check connect wallet button
    const connectButton = screen.getByText('Connect Wallet')
    expect(connectButton).toBeInTheDocument()
    expect(connectButton.tagName).toBe('BUTTON')
  })

  it('has proper styling classes', () => {
    const { container } = renderWithRouter(<Create />)
    
    // Check basic styling
    expect(container.querySelector('.min-h-screen')).toBeInTheDocument()
    expect(container.querySelector('.bg-gray-50')).toBeInTheDocument()
  })
})