import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import GlobalAudioPlayer from '../GlobalAudioPlayer'

// Mock the AudioContext
const mockAudioContext = {
  currentTrack: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.5,
  isMuted: false,
  togglePlayback: vi.fn(),
  playNext: vi.fn(),
  playPrevious: vi.fn(),
  seekTo: vi.fn(),
  setVolumeLevel: vi.fn(),
  toggleMute: vi.fn(),
  stopPlayback: vi.fn()
}

vi.mock('../../contexts/AudioContext', () => ({
  useAudio: () => mockAudioContext
}))

vi.mock('lucide-react', () => ({
  Play: () => <div data-testid="play-icon">Play</div>,
  Pause: () => <div data-testid="pause-icon">Pause</div>,
  SkipBack: () => <div data-testid="skip-back-icon">SkipBack</div>,
  SkipForward: () => <div data-testid="skip-forward-icon">SkipForward</div>,
  Volume2: () => <div data-testid="volume-icon">Volume2</div>,
  VolumeX: () => <div data-testid="volume-x-icon">VolumeX</div>,
  X: () => <div data-testid="x-icon">X</div>,
  Heart: () => <div data-testid="heart-icon">Heart</div>,
  Share2: () => <div data-testid="share-icon">Share2</div>
}))

const mockTrack = {
  title: 'Test Song',
  artist: 'Test Artist',
  coverImage: 'https://example.com/cover.jpg'
}

describe('GlobalAudioPlayer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAudioContext.currentTrack = null
    mockAudioContext.isPlaying = false
    mockAudioContext.currentTime = 0
    mockAudioContext.duration = 0
    mockAudioContext.volume = 0.5
    mockAudioContext.isMuted = false
  })

  it('renders nothing when no current track', () => {
    const { container } = render(<GlobalAudioPlayer />)
    expect(container.firstChild).toBeNull()
  })

  it('renders player when current track exists', () => {
    mockAudioContext.currentTrack = mockTrack
    render(<GlobalAudioPlayer />)
    
    expect(screen.getByText('Test Song')).toBeInTheDocument()
    expect(screen.getByText('Test Artist')).toBeInTheDocument()
  })

  it('displays track cover image', () => {
    mockAudioContext.currentTrack = mockTrack
    render(<GlobalAudioPlayer />)
    
    const coverImage = screen.getByAltText('Test Song')
    expect(coverImage).toBeInTheDocument()
    expect(coverImage).toHaveAttribute('src', 'https://example.com/cover.jpg')
  })

  it('shows play icon when not playing', () => {
    mockAudioContext.currentTrack = mockTrack
    mockAudioContext.isPlaying = false
    render(<GlobalAudioPlayer />)
    
    expect(screen.getByTestId('play-icon')).toBeInTheDocument()
  })

  it('shows pause icon when playing', () => {
    mockAudioContext.currentTrack = mockTrack
    mockAudioContext.isPlaying = true
    render(<GlobalAudioPlayer />)
    
    expect(screen.getByTestId('pause-icon')).toBeInTheDocument()
  })

  it('calls togglePlayback when play/pause button is clicked', () => {
    mockAudioContext.currentTrack = mockTrack
    render(<GlobalAudioPlayer />)
    
    const playButton = screen.getByRole('button', { name: /play/i })
    fireEvent.click(playButton)
    
    expect(mockAudioContext.togglePlayback).toHaveBeenCalledTimes(1)
  })

  it('calls playPrevious when previous button is clicked', () => {
    mockAudioContext.currentTrack = mockTrack
    render(<GlobalAudioPlayer />)
    
    const prevButton = screen.getByTestId('skip-back-icon').closest('button')
    fireEvent.click(prevButton)
    
    expect(mockAudioContext.playPrevious).toHaveBeenCalledTimes(1)
  })

  it('calls playNext when next button is clicked', () => {
    mockAudioContext.currentTrack = mockTrack
    render(<GlobalAudioPlayer />)
    
    const nextButton = screen.getByTestId('skip-forward-icon').closest('button')
    fireEvent.click(nextButton)
    
    expect(mockAudioContext.playNext).toHaveBeenCalledTimes(1)
  })

  it('formats time correctly', () => {
    mockAudioContext.currentTrack = mockTrack
    mockAudioContext.currentTime = 125 // 2:05
    mockAudioContext.duration = 245 // 4:05
    render(<GlobalAudioPlayer />)
    
    expect(screen.getByText('2:05')).toBeInTheDocument()
    expect(screen.getByText('4:05')).toBeInTheDocument()
  })

  it('handles NaN time values', () => {
    mockAudioContext.currentTrack = mockTrack
    mockAudioContext.currentTime = NaN
    mockAudioContext.duration = NaN
    render(<GlobalAudioPlayer />)
    
    const timeElements = screen.getAllByText('0:00')
    expect(timeElements).toHaveLength(2)
  })

  it('renders progress bar when track is playing', () => {
    mockAudioContext.currentTrack = mockTrack
    mockAudioContext.currentTime = 50
    mockAudioContext.duration = 100
    
    const { container } = render(<GlobalAudioPlayer />)
    
    // 查找进度条容器和进度条元素
    const progressContainer = container.querySelector('.bg-gray-200')
    const progressBar = container.querySelector('.bg-indigo-600')
    
    expect(progressContainer).toBeInTheDocument()
    expect(progressBar).toBeInTheDocument()
  })

  it('calls seekTo when progress bar is clicked', () => {
    mockAudioContext.currentTrack = mockTrack
    mockAudioContext.duration = 100
    render(<GlobalAudioPlayer />)
    
    const progressContainer = document.querySelector('.bg-gray-200')
    
    // Mock getBoundingClientRect
    progressContainer.getBoundingClientRect = vi.fn(() => ({
      left: 0,
      width: 200
    }))
    
    fireEvent.click(progressContainer, { clientX: 100 })
    
    expect(mockAudioContext.seekTo).toHaveBeenCalledWith(50)
  })

  it('shows volume icon when not muted', () => {
    mockAudioContext.currentTrack = mockTrack
    mockAudioContext.isMuted = false
    mockAudioContext.volume = 0.5
    render(<GlobalAudioPlayer />)
    
    expect(screen.getByTestId('volume-icon')).toBeInTheDocument()
  })

  it('shows muted icon when muted', () => {
    mockAudioContext.currentTrack = mockTrack
    mockAudioContext.isMuted = true
    render(<GlobalAudioPlayer />)
    
    expect(screen.getByTestId('volume-x-icon')).toBeInTheDocument()
  })

  it('shows muted icon when volume is 0', () => {
    mockAudioContext.currentTrack = mockTrack
    mockAudioContext.isMuted = false
    mockAudioContext.volume = 0
    render(<GlobalAudioPlayer />)
    
    expect(screen.getByTestId('volume-x-icon')).toBeInTheDocument()
  })

  it('calls toggleMute when volume button is clicked', () => {
    mockAudioContext.currentTrack = mockTrack
    render(<GlobalAudioPlayer />)
    
    const volumeButton = screen.getByTestId('volume-icon').closest('button')
    fireEvent.click(volumeButton)
    
    expect(mockAudioContext.toggleMute).toHaveBeenCalledTimes(1)
  })

  it('calls setVolumeLevel when volume slider is changed', () => {
    mockAudioContext.currentTrack = mockTrack
    render(<GlobalAudioPlayer />)
    
    const volumeSlider = screen.getByRole('slider')
    fireEvent.change(volumeSlider, { target: { value: '0.8' } })
    
    expect(mockAudioContext.setVolumeLevel).toHaveBeenCalledWith(0.8)
  })

  it('sets volume slider value to 0 when muted', () => {
    mockAudioContext.currentTrack = mockTrack
    mockAudioContext.isMuted = true
    mockAudioContext.volume = 0.5
    render(<GlobalAudioPlayer />)
    
    const volumeSlider = screen.getByRole('slider')
    expect(volumeSlider).toHaveValue('0')
  })

  it('sets volume slider value to actual volume when not muted', () => {
    mockAudioContext.currentTrack = mockTrack
    mockAudioContext.isMuted = false
    mockAudioContext.volume = 0.7
    render(<GlobalAudioPlayer />)
    
    const volumeSlider = screen.getByRole('slider')
    expect(volumeSlider).toHaveValue('0.7')
  })

  it('calls stopPlayback when close button is clicked', () => {
    mockAudioContext.currentTrack = mockTrack
    render(<GlobalAudioPlayer />)
    
    const closeButton = screen.getByTestId('x-icon').closest('button')
    fireEvent.click(closeButton)
    
    expect(mockAudioContext.stopPlayback).toHaveBeenCalledTimes(1)
  })

  it('renders action buttons (heart and share)', () => {
    mockAudioContext.currentTrack = mockTrack
    render(<GlobalAudioPlayer />)
    
    expect(screen.getByTestId('heart-icon')).toBeInTheDocument()
    expect(screen.getByTestId('share-icon')).toBeInTheDocument()
  })

  it('applies correct styling classes', () => {
    mockAudioContext.currentTrack = mockTrack
    const { container } = render(<GlobalAudioPlayer />)
    
    const playerContainer = container.firstChild
    expect(playerContainer).toHaveClass('fixed', 'bottom-0', 'left-0', 'right-0', 'bg-white', 'border-t', 'shadow-lg', 'z-40')
  })
})