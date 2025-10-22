import React, { useState, memo } from 'react'
import { Play, Pause, Heart, Share2, Download, MoreVertical } from 'lucide-react'
import LazyImage from './LazyImage'

const MusicCard = memo(({ 
  title, 
  artist, 
  duration, 
  coverImage, 
  audioSrc, 
  isPlaying, 
  onPlay, 
  onPause,
  onLike,
  onShare,
  onDownload,
  isLiked = false,
  className = ""
}) => {
  const [showMenu, setShowMenu] = useState(false)

  const handlePlayPause = () => {
    if (isPlaying) {
      onPause?.()
    } else {
      onPlay?.()
    }
  }

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200 ${className}`}>
      {/* Cover Image */}
      <div className="relative aspect-square bg-gradient-to-br from-purple-400 to-pink-400">
        {coverImage ? (
          <LazyImage 
            src={coverImage} 
            alt={title}
            className="w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <Play className="w-8 h-8 text-white" />
            </div>
          </div>
        )}
        
        {/* Play Button Overlay */}
        <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <button
            onClick={handlePlayPause}
            className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 text-gray-900" />
            ) : (
              <Play className="w-5 h-5 text-gray-900 ml-0.5" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title and Artist */}
        <div className="mb-3">
          <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
            {title}
          </h3>
          <p className="text-gray-600 text-xs sm:text-sm truncate">
            {artist}
          </p>
        </div>

        {/* Duration */}
        <div className="mb-3">
          <span className="text-xs text-gray-500">
            {formatDuration(duration)}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Like Button */}
            <button
              onClick={onLike}
              className={`p-1.5 rounded-full transition-colors ${
                isLiked 
                  ? 'text-red-500 hover:text-red-600' 
                  : 'text-gray-400 hover:text-red-500'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            </button>

            {/* Share Button */}
            <button
              onClick={onShare}
              className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {/* Download Button */}
            <button
              onClick={onDownload}
              className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>

          {/* More Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[120px]">
                <button
                  onClick={() => {
                    onShare?.()
                    setShowMenu(false)
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  Share
                </button>
                <button
                  onClick={() => {
                    onDownload?.()
                    setShowMenu(false)
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  Download
                </button>
                <button
                  onClick={() => {
                    // Add to playlist functionality
                    setShowMenu(false)
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  Add to Playlist
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}, (prevProps, nextProps) => {
  // 自定义比较函数，只在关键props变化时重新渲染
  return (
    prevProps.title === nextProps.title &&
    prevProps.artist === nextProps.artist &&
    prevProps.duration === nextProps.duration &&
    prevProps.coverImage === nextProps.coverImage &&
    prevProps.audioSrc === nextProps.audioSrc &&
    prevProps.isPlaying === nextProps.isPlaying &&
    prevProps.isLiked === nextProps.isLiked &&
    prevProps.className === nextProps.className
  )
})

export default MusicCard