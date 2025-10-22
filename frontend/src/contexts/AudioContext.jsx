import React, { createContext, useContext, useState, useRef, useEffect } from 'react'
import useAudioPreloader from '../hooks/useAudioPreloader'

const AudioContext = createContext()

export const useAudio = () => {
  const context = useContext(AudioContext)
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider')
  }
  return context
}

export const AudioProvider = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [playlist, setPlaylist] = useState([])
  const [currentIndex, setCurrentIndex] = useState(-1)
  const audioRef = useRef(null)

  // 音频预加载功能
  const playlistUrls = playlist.map(track => track.audioSrc).filter(Boolean)
  const { 
    preloadAudios, 
    getPreloadedAudio, 
    loadingProgress,
    isLoading: isPreloading 
  } = useAudioPreloader(playlistUrls, 2)

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio()
      audioRef.current.preload = 'metadata'
    }

    const audio = audioRef.current

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handleDurationChange = () => setDuration(audio.duration)
    const handleEnded = () => {
      setIsPlaying(false)
      playNext()
    }
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleDurationChange)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleDurationChange)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
    }
  }, [])

  // Update audio source when track changes
  useEffect(() => {
    if (currentTrack && audioRef.current) {
      audioRef.current.src = currentTrack.audioUrl
      audioRef.current.volume = isMuted ? 0 : volume
    }
  }, [currentTrack, volume, isMuted])

  const playTrack = async (track, trackList = null) => {
    try {
      setCurrentTrack(track)
      
      if (trackList) {
        setPlaylist(trackList)
        const index = trackList.findIndex(t => t.id === track.id)
        setCurrentIndex(index)
        
        // 预加载播放列表中的音频
        const urls = trackList.map(t => t.audioSrc || t.audioUrl).filter(Boolean)
        preloadAudios(urls)
      }

      // 尝试使用预加载的音频
      const preloadedAudio = getPreloadedAudio(track.audioSrc || track.audioUrl)
      if (preloadedAudio && audioRef.current) {
        // 如果有预加载的音频，复制其状态到主播放器
        audioRef.current.src = preloadedAudio.src
        audioRef.current.currentTime = 0
      }

      if (audioRef.current) {
        await audioRef.current.play()
      }
    } catch (error) {
      console.error('Failed to play track:', error)
    }
  }

  const pauseTrack = () => {
    if (audioRef.current) {
      audioRef.current.pause()
    }
  }

  const togglePlayback = () => {
    if (isPlaying) {
      pauseTrack()
    } else if (currentTrack && audioRef.current) {
      audioRef.current.play()
    }
  }

  const playNext = () => {
    if (playlist.length > 0 && currentIndex < playlist.length - 1) {
      const nextTrack = playlist[currentIndex + 1]
      playTrack(nextTrack, playlist)
    }
  }

  const playPrevious = () => {
    if (playlist.length > 0 && currentIndex > 0) {
      const prevTrack = playlist[currentIndex - 1]
      playTrack(prevTrack, playlist)
    }
  }

  const seekTo = (time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  const setVolumeLevel = (newVolume) => {
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : newVolume
    }
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
    if (audioRef.current) {
      audioRef.current.volume = !isMuted ? 0 : volume
    }
  }

  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setCurrentTrack(null)
    setIsPlaying(false)
    setCurrentTime(0)
  }

  const value = {
    // State
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    playlist,
    currentIndex,
    
    // Preloader state
    loadingProgress,
    isPreloading,
    
    // Actions
    playTrack,
    pauseTrack,
    togglePlayback,
    playNext,
    playPrevious,
    seekTo,
    setVolumeLevel,
    toggleMute,
    stopPlayback
  }

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  )
}

export default AudioContext