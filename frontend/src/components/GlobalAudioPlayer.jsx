import React from 'react'
import { useAudio } from '../contexts/AudioContext'
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  X,
  Heart,
  Share2
} from 'lucide-react'

const GlobalAudioPlayer = () => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    togglePlayback,
    playNext,
    playPrevious,
    seekTo,
    setVolumeLevel,
    toggleMute,
    stopPlayback
  } = useAudio()

  if (!currentTrack) return null

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0

  const handleProgressClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const newTime = (clickX / rect.width) * duration
    seekTo(newTime)
  }

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value)
    setVolumeLevel(newVolume)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-40">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Track Info */}
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {currentTrack.coverImage && (
              <img
                src={currentTrack.coverImage}
                alt={currentTrack.title}
                className="w-12 h-12 rounded-lg object-cover"
              />
            )}
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-gray-900 truncate">
                {currentTrack.title}
              </h3>
              <p className="text-sm text-gray-500 truncate">
                {currentTrack.artist}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-4 flex-1 justify-center">
            <button
              onClick={playPrevious}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <SkipBack className="h-5 w-5" />
            </button>
            
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
            
            <button
              onClick={playNext}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <SkipForward className="h-5 w-5" />
            </button>
          </div>

          {/* Progress and Volume */}
          <div className="flex items-center space-x-4 flex-1 justify-end">
            {/* Progress */}
            <div className="flex items-center space-x-2 min-w-0 flex-1 max-w-xs">
              <span className="text-xs text-gray-500 whitespace-nowrap">
                {formatTime(currentTime)}
              </span>
              <div 
                className="flex-1 h-1 bg-gray-200 rounded-full cursor-pointer"
                onClick={handleProgressClick}
              >
                <div 
                  className="h-full bg-indigo-600 rounded-full transition-all duration-150"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 whitespace-nowrap">
                {formatTime(duration)}
              </span>
            </div>

            {/* Volume */}
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
                className="w-16 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              <button className="text-gray-400 hover:text-gray-600 transition-colors">
                <Heart className="h-4 w-4" />
              </button>
              <button className="text-gray-400 hover:text-gray-600 transition-colors">
                <Share2 className="h-4 w-4" />
              </button>
              <button
                onClick={stopPlayback}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GlobalAudioPlayer