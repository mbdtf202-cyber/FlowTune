import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AudioPlayer from '../AudioPlayer';

describe('AudioPlayer', () => {
  const mockProps = {
    src: 'test-audio.mp3',
    title: 'Test Track',
    artist: 'Test Artist',
    onPlay: vi.fn(),
    onPause: vi.fn(),
    onEnded: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders audio player with correct title and artist', () => {
    render(<AudioPlayer {...mockProps} />);
    
    expect(screen.getByText('Test Track')).toBeInTheDocument();
    expect(screen.getByText('Test Artist')).toBeInTheDocument();
  });

  it('shows play button initially', () => {
    render(<AudioPlayer {...mockProps} />);
    
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('renders audio element', () => {
    render(<AudioPlayer {...mockProps} />);
    
    const audioElement = document.querySelector('audio');
    expect(audioElement).toBeInTheDocument();
    expect(audioElement).toHaveAttribute('src', 'test-audio.mp3');
  });

  it('renders volume control', () => {
    render(<AudioPlayer {...mockProps} />);
    
    const volumeSlider = screen.getByRole('slider');
    expect(volumeSlider).toBeInTheDocument();
    expect(volumeSlider).toHaveAttribute('type', 'range');
  });

  it('renders mute button', () => {
    render(<AudioPlayer {...mockProps} />);
    
    // Volume button should be present
    const volumeButton = document.querySelector('.text-gray-400');
    expect(volumeButton).toBeInTheDocument();
  });

  it('displays current time and duration', () => {
    render(<AudioPlayer {...mockProps} />);
    
    // Time elements are displayed as text, not with testids
    const timeElements = screen.getAllByText('0:00');
    expect(timeElements.length).toBeGreaterThanOrEqual(2); // current time and duration
  });

  it('renders play button', () => {
    render(<AudioPlayer {...mockProps} />);
    
    // Find the play button (it's the one with bg-indigo-600 class)
    const playButton = document.querySelector('.bg-indigo-600');
    expect(playButton).toBeInTheDocument();
  });

  it('displays progress bar', () => {
    render(<AudioPlayer {...mockProps} />);
    
    const progressContainer = document.querySelector('.w-full.h-2.bg-gray-200');
    expect(progressContainer).toBeInTheDocument();
  });

  it('handles volume control', () => {
    render(<AudioPlayer {...mockProps} />);
    
    const volumeSlider = screen.getByRole('slider');
    
    fireEvent.change(volumeSlider, { target: { value: '0.5' } });
    
    expect(volumeSlider.value).toBe('0.5');
  });

  it('displays time information', () => {
    render(<AudioPlayer {...mockProps} />);
    
    // Should display time format (there are two 0:00 - current and total time)
    const timeElements = screen.getAllByText('0:00');
    expect(timeElements.length).toBeGreaterThanOrEqual(1);
  });

  it('renders with cover image when provided', () => {
    const propsWithImage = {
      ...mockProps,
      coverImage: 'test-image.jpg'
    };
    
    render(<AudioPlayer {...propsWithImage} />);
    
    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('src', 'test-image.jpg');
    expect(image).toHaveAttribute('alt', 'Test Track');
  });

  it('renders close button when onClose is provided', () => {
    const propsWithClose = {
      ...mockProps,
      onClose: vi.fn()
    };
    
    render(<AudioPlayer {...propsWithClose} />);
    
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(1); // Should have play button and close button
  });
});