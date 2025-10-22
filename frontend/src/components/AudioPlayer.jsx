import React, { useState, useRef, useEffect, memo } from 'react'
import { Play, Pause, Volume2, VolumeX, X } from 'lucide-react'

const AudioPlayer = memo(({ 
  src, 
  title = 'Audio Track', 
  artist = 'Unknown Artist',
  coverImage = null,
  duration = null,
  onPlay = () => {},
  onPause = () => {},
  onEnded = () => {},
  onClose = null
}) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [totalDuration, setTotalDuration] = useState(duration || 0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [error, setError] = useState(null)
  const audioRef = useRef(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => {
      setTotalDuration(audio.duration)
      setError(null)
    }
    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
      onEnded()
    }
    const handlePlay = () => {
      setIsPlaying(true)
      onPlay()
    }
    const handlePause = () => {
      setIsPlaying(false)
      onPause()
    }
    const handleError = (e) => {
      console.error('Audio playback error:', e)
      setError('Audio playback failed, please check the audio file')
      setIsPlaying(false)
    }
    const handleCanPlay = () => {
      setError(null)
    }

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('error', handleError)
    audio.addEventListener('canplay', handleCanPlay)

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('error', handleError)
      audio.removeEventListener('canplay', handleCanPlay)
    }
  }, [onPlay, onPause, onEnded])

  const togglePlayback = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
  }

  const handleProgressClick = (e) => {
    const audio = audioRef.current
    if (!audio) return

    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const newTime = (clickX / rect.width) * totalDuration
    
    audio.currentTime = newTime
    setCurrentTime(newTime)
  }

  const toggleMute = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isMuted) {
      audio.volume = volume
      setIsMuted(false)
    } else {
      audio.volume = 0
      setIsMuted(true)
    }
  }

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value)
    const audio = audioRef.current
    
    setVolume(newVolume)
    if (audio) {
      audio.volume = newVolume
    }
    
    if (newVolume === 0) {
      setIsMuted(true)
    } else if (isMuted) {
      setIsMuted(false)
    }
  }

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00'
    
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const progressPercentage = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <audio ref={audioRef} src={src} preload="metadata" />
      
      {/* Header with close button */}
      {onClose && (
        <div className="flex justify-between items-center mb-4">
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
      
      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      
      {/* Track Info */}
      <div className="flex items-center mb-4">
        {coverImage && (
          <img
            src={coverImage}
            alt={title}
            className="w-12 h-12 rounded-lg object-cover mr-3"
          />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">{title}</h3>
          <p className="text-sm text-gray-500 truncate">{artist}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div 
          className="w-full h-2 bg-gray-200 rounded-full cursor-pointer"
          onClick={handleProgressClick}
        >
          <div 
            className="h-full bg-indigo-600 rounded-full transition-all duration-150"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(totalDuration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Play/Pause Button */}
          <button
            onClick={togglePlayback}
            className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 transition-colors"
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 ml-0.5" />
            )}
          </button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleMute}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-16 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>
      </div>
    </div>
  )
}, (prevProps, nextProps) => {
  // 自定义比较函数，只在关键props变化时重新渲染
  return (
    prevProps.src === nextProps.src &&
    prevProps.title === nextProps.title &&
    prevProps.artist === nextProps.artist &&
    prevProps.coverImage === nextProps.coverImage &&
    prevProps.duration === nextProps.duration
  )
})

export default AudioPlayer