import React from 'react'
import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import ConnectionStatus from '../ConnectionStatus'

// Mock the useRealTimeData hook
vi.mock('../../hooks/useWebSocket', () => ({
  useRealTimeData: vi.fn()
}))

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Wifi: ({ className }) => <div data-testid="wifi-icon" className={className} />,
  WifiOff: ({ className }) => <div data-testid="wifi-off-icon" className={className} />,
  Clock: ({ className }) => <div data-testid="clock-icon" className={className} />
}))

import { useRealTimeData } from '../../hooks/useWebSocket'

describe('ConnectionStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders connected status correctly', () => {
    useRealTimeData.mockReturnValue({
      isConnected: true,
      lastUpdateTime: Date.now(),
      connectionStatus: 'connected'
    })

    render(<ConnectionStatus />)
    
    expect(screen.getByTestId('wifi-icon')).toBeInTheDocument()
    expect(screen.getByText('Real-time Connected')).toBeInTheDocument()
    expect(screen.getByText('Just updated')).toBeInTheDocument()
  })

  it('renders disconnected status correctly', () => {
    useRealTimeData.mockReturnValue({
      isConnected: false,
      lastUpdateTime: null,
      connectionStatus: 'disconnected'
    })

    render(<ConnectionStatus />)
    
    expect(screen.getByTestId('wifi-off-icon')).toBeInTheDocument()
    expect(screen.getByText('Disconnected')).toBeInTheDocument()
  })

  it('renders connecting status correctly', () => {
    useRealTimeData.mockReturnValue({
      isConnected: false,
      lastUpdateTime: null,
      connectionStatus: 'connecting'
    })

    render(<ConnectionStatus />)
    
    expect(screen.getByTestId('wifi-off-icon')).toBeInTheDocument()
    expect(screen.getByText('Connecting...')).toBeInTheDocument()
  })

  it('formats last update time correctly for minutes', () => {
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000)
    useRealTimeData.mockReturnValue({
      isConnected: true,
      lastUpdateTime: fiveMinutesAgo,
      connectionStatus: 'connected'
    })

    render(<ConnectionStatus />)
    
    expect(screen.getByText('Updated 5 minutes ago')).toBeInTheDocument()
  })

  it('formats last update time correctly for hours', () => {
    const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000)
    useRealTimeData.mockReturnValue({
      isConnected: true,
      lastUpdateTime: twoHoursAgo,
      connectionStatus: 'connected'
    })

    render(<ConnectionStatus />)
    
    expect(screen.getByText('Updated 2 hours ago')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    useRealTimeData.mockReturnValue({
      isConnected: true,
      lastUpdateTime: Date.now(),
      connectionStatus: 'connected'
    })

    const { container } = render(<ConnectionStatus className="custom-class" />)
    
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('shows status indicator dot for connected state', () => {
    useRealTimeData.mockReturnValue({
      isConnected: true,
      lastUpdateTime: Date.now(),
      connectionStatus: 'connected'
    })

    const { container } = render(<ConnectionStatus />)
    
    const statusDot = container.querySelector('.bg-green-500')
    expect(statusDot).toBeInTheDocument()
  })

  it('shows status indicator dot for disconnected state', () => {
    useRealTimeData.mockReturnValue({
      isConnected: false,
      lastUpdateTime: null,
      connectionStatus: 'disconnected'
    })

    const { container } = render(<ConnectionStatus />)
    
    const statusDot = container.querySelector('.bg-red-500')
    expect(statusDot).toBeInTheDocument()
  })

  it('does not show last update time when not available', () => {
    useRealTimeData.mockReturnValue({
      isConnected: true,
      lastUpdateTime: null,
      connectionStatus: 'connected'
    })

    render(<ConnectionStatus />)
    
    expect(screen.queryByTestId('clock-icon')).not.toBeInTheDocument()
  })
})