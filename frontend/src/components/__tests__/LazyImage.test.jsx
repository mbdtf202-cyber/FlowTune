import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import LazyImage from '../LazyImage'

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn()
mockIntersectionObserver.mockReturnValue({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
})
window.IntersectionObserver = mockIntersectionObserver

describe('LazyImage', () => {
  const defaultProps = {
    src: 'https://example.com/image.jpg',
    alt: 'Test image',
    className: 'test-class'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with default props', () => {
    const { container } = render(<LazyImage {...defaultProps} />)
    
    expect(container.firstChild).toBeInTheDocument()
    expect(container.firstChild).toHaveClass('test-class')
  })

  it('shows loading placeholder initially', () => {
    const { container } = render(<LazyImage {...defaultProps} />)
    
    const placeholder = container.querySelector('.animate-pulse')
    expect(placeholder).toBeInTheDocument()
  })

  it('sets up IntersectionObserver', () => {
    render(<LazyImage {...defaultProps} />)
    
    expect(mockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ threshold: 0.1 })
    )
  })

  it('applies custom className', () => {
    const { container } = render(<LazyImage {...defaultProps} />)
    
    expect(container.firstChild).toHaveClass('test-class')
  })

  it('handles missing src prop', () => {
    const { container } = render(<LazyImage alt="Test image" />)
    
    const placeholder = container.querySelector('.animate-pulse')
    expect(placeholder).toBeInTheDocument()
  })

  it('shows default placeholder when no placeholder prop provided', () => {
    const { container } = render(<LazyImage {...defaultProps} />)
    
    const placeholder = container.querySelector('.animate-pulse')
    expect(placeholder).toBeInTheDocument()
  })

  it('shows loading state display', () => {
    const { container } = render(<LazyImage {...defaultProps} />)
    
    const loadingState = container.querySelector('.bg-gray-200')
    expect(loadingState).toBeInTheDocument()
  })

  it('passes through additional props', () => {
    render(<LazyImage {...defaultProps} data-testid="lazy-image" />)
    
    const image = screen.getByTestId('lazy-image')
    expect(image).toBeInTheDocument()
  })
})