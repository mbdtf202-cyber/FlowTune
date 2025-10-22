import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import Notification, { useNotification } from '../Notification'

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  CheckCircle: ({ className }) => <div data-testid="check-circle" className={className} />,
  AlertCircle: ({ className }) => <div data-testid="alert-circle" className={className} />,
  Info: ({ className }) => <div data-testid="info-icon" className={className} />,
  X: ({ className }) => <div data-testid="close-icon" className={className} />
}))

describe('Notification', () => {
  const defaultProps = {
    type: 'info',
    title: 'Test Title',
    message: 'Test message',
    onClose: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders notification with title and message', () => {
    render(<Notification {...defaultProps} />)
    
    expect(screen.getByText('Test Title')).toBeInTheDocument()
    expect(screen.getByText('Test message')).toBeInTheDocument()
  })

  it('renders info icon for info type', () => {
    render(<Notification {...defaultProps} type="info" />)
    
    expect(screen.getByTestId('info-icon')).toBeInTheDocument()
  })

  it('renders success icon for success type', () => {
    render(<Notification {...defaultProps} type="success" />)
    
    expect(screen.getByTestId('check-circle')).toBeInTheDocument()
  })

  it('renders error icon for error type', () => {
    render(<Notification {...defaultProps} type="error" />)
    
    expect(screen.getByTestId('alert-circle')).toBeInTheDocument()
  })

  it('renders warning icon for warning type', () => {
    render(<Notification {...defaultProps} type="warning" />)
    
    expect(screen.getByTestId('alert-circle')).toBeInTheDocument()
  })

  it('applies correct background color for success type', () => {
    const { container } = render(<Notification {...defaultProps} type="success" />)
    
    const notification = container.querySelector('.bg-green-50')
    expect(notification).toBeInTheDocument()
  })

  it('applies correct background color for error type', () => {
    const { container } = render(<Notification {...defaultProps} type="error" />)
    
    const notification = container.querySelector('.bg-red-50')
    expect(notification).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    render(<Notification {...defaultProps} />)
    
    const closeButton = screen.getByTestId('close-icon').closest('button')
    fireEvent.click(closeButton)
    
    // Wait for animation delay
    vi.advanceTimersByTime(300)
    
    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('auto-closes after specified duration', async () => {
    render(<Notification {...defaultProps} duration={1000} />)
    
    // Fast-forward time
    vi.advanceTimersByTime(1000)
    
    // Wait for animation delay
    vi.advanceTimersByTime(300)
    
    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('does not auto-close when duration is 0', () => {
    render(<Notification {...defaultProps} duration={0} />)
    
    vi.advanceTimersByTime(10000)
    
    expect(defaultProps.onClose).not.toHaveBeenCalled()
  })

  it('renders without title', () => {
    render(<Notification {...defaultProps} title={undefined} />)
    
    expect(screen.queryByText('Test Title')).not.toBeInTheDocument()
    expect(screen.getByText('Test message')).toBeInTheDocument()
  })

  it('renders without message', () => {
    render(<Notification {...defaultProps} message={undefined} />)
    
    expect(screen.getByText('Test Title')).toBeInTheDocument()
    expect(screen.queryByText('Test message')).not.toBeInTheDocument()
  })

  it('has correct positioning classes', () => {
    const { container } = render(<Notification {...defaultProps} />)
    
    const notification = container.firstChild
    expect(notification).toHaveClass('fixed', 'top-4', 'right-4', 'z-50')
  })

  it('shows visible state initially', () => {
    const { container } = render(<Notification {...defaultProps} />)
    
    const notification = container.firstChild
    expect(notification).toHaveClass('translate-x-0', 'opacity-100')
  })
})

// Test the useNotification hook
describe('useNotification hook', () => {
  const TestComponent = () => {
    const { addNotification, NotificationContainer } = useNotification()
    
    return (
      <div>
        <button 
          onClick={() => addNotification({ 
            type: 'success', 
            title: 'Success', 
            message: 'Operation completed' 
          })}
        >
          Add Notification
        </button>
        <NotificationContainer />
      </div>
    )
  }

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('adds and displays notifications', () => {
    render(<TestComponent />)
    
    const addButton = screen.getByText('Add Notification')
    fireEvent.click(addButton)
    
    expect(screen.getByText('Success')).toBeInTheDocument()
    expect(screen.getByText('Operation completed')).toBeInTheDocument()
  })
})