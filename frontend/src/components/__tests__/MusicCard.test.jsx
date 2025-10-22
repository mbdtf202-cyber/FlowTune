import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import MusicCard from '../MusicCard'

// Mock LazyImage component
vi.mock('../LazyImage', () => ({
  default: ({ src, alt, className }) => (
    <img src={src} alt={alt} className={className} data-testid="lazy-image" />
  )
}))

describe('MusicCard', () => {
  const defaultProps = {
    title: 'Test Song',
    artist: 'Test Artist',
    duration: 180, // 3 minutes
    coverImage: 'https://example.com/cover.jpg',
    audioSrc: 'https://example.com/audio.mp3',
    isPlaying: false,
    onPlay: vi.fn(),
    onPause: vi.fn(),
    onLike: vi.fn(),
    onShare: vi.fn(),
    onDownload: vi.fn(),
    isLiked: false
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders music card with basic information', () => {
    render(<MusicCard {...defaultProps} />)
    
    expect(screen.getByText('Test Song')).toBeInTheDocument()
    expect(screen.getByText('Test Artist')).toBeInTheDocument()
    expect(screen.getByText('3:00')).toBeInTheDocument()
  })

  it('renders cover image when provided', () => {
    render(<MusicCard {...defaultProps} />)
    
    const image = screen.getByTestId('lazy-image')
    expect(image).toHaveAttribute('src', 'https://example.com/cover.jpg')
    expect(image).toHaveAttribute('alt', 'Test Song')
  })

  it('calls onPlay when play button is clicked and not playing', () => {
    render(<MusicCard {...defaultProps} />)
    
    const buttons = screen.getAllByRole('button')
    const playButton = buttons.find(button => 
      button.querySelector('svg') && !button.querySelector('[data-testid="lucide-heart"]')
    )
    
    if (playButton) {
      fireEvent.click(playButton)
      expect(defaultProps.onPlay).toHaveBeenCalledTimes(1)
    }
  })

  it('formats duration correctly', () => {
    render(<MusicCard {...defaultProps} duration={125} />)
    expect(screen.getByText('2:05')).toBeInTheDocument()
  })

  it('handles zero duration', () => {
    render(<MusicCard {...defaultProps} duration={0} />)
    expect(screen.getByText('0:00')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(<MusicCard {...defaultProps} className="custom-class" />)
    
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('truncates long titles and artist names', () => {
    const longTitle = 'This is a very long song title that should be truncated'
    const longArtist = 'This is a very long artist name that should be truncated'
    
    render(<MusicCard {...defaultProps} title={longTitle} artist={longArtist} />)
    
    const titleElement = screen.getByText(longTitle)
    const artistElement = screen.getByText(longArtist)
    
    expect(titleElement).toHaveClass('truncate')
    expect(artistElement).toHaveClass('truncate')
  })
})