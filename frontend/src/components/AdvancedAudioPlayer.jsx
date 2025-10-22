import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, Settings, Download, Share2, Heart } from 'lucide-react';
import SocialShare from './SocialShare';

const AdvancedAudioPlayer = ({ 
  track, 
  onPlayCountUpdate, 
  onPlayComplete,
  userTier = 'free',
  className = '' 
}) => {
  const audioRef = useRef(null);
  const progressRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [quality, setQuality] = useState(userTier === 'free' ? 'free' : 'premium');
  const [showSettings, setShowSettings] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [playCount, setPlayCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [error, setError] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);

  // Quality options
  const qualityOptions = {
    free: { label: 'Preview (128kbps)', bitrate: 128, maxDuration: 30 },
    premium: { label: 'High Quality (320kbps)', bitrate: 320, maxDuration: null },
    hifi: { label: 'Lossless (1411kbps)', bitrate: 1411, maxDuration: null }
  };

  // Get available quality options
  const getAvailableQualities = () => {
    const available = ['free'];
    if (userTier === 'premium' || userTier === 'hifi') {
      available.push('premium');
    }
    if (userTier === 'hifi') {
      available.push('hifi');
    }
    return available;
  };

  // Start playback
  const startPlayback = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await window.fetch('/api/audio/play/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ trackId: track.id })
      });

      if (!response.ok) {
        throw new Error('Failed to start playback');
      }

      const data = await response.json();
      setSessionId(data.sessionId);
      
      // Set audio source
      if (audioRef.current) {
        audioRef.current.src = data.streamUrl;
        audioRef.current.load();
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error starting playback:', error);
      setError('Failed to start playback');
      setIsLoading(false);
    }
  };

  // Update playback progress
  const updateProgress = async (currentTime, duration) => {
    if (!sessionId) return;

    try {
      await window.fetch('/api/audio/play/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          sessionId,
          currentTime,
          totalDuration: duration
        })
      });
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  // End playback
  const endPlayback = async () => {
    if (!sessionId) return;

    try {
      const response = await window.fetch('/api/audio/play/end', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ sessionId })
      });

      const data = await response.json();
      if (data.wasValid && onPlayCountUpdate) {
        onPlayCountUpdate(track.id);
        setPlayCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error ending playback:', error);
    }
  };

  // Toggle play/pause
  const togglePlayPause = async () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (!sessionId) {
        await startPlayback();
      }
      
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('Error playing audio:', error);
        setError('Failed to play audio');
      }
    }
  };

  // Volume control
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  // Toggle mute
  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  // Progress bar control
  const handleProgressClick = (e) => {
    if (!audioRef.current || !progressRef.current) return;

    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const newTime = (clickX / width) * duration;
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Quality switching
  const handleQualityChange = (newQuality) => {
    setQuality(newQuality);
    setShowSettings(false);
    
    // If playing, need to restart playback session
    if (isPlaying) {
      setIsPlaying(false);
      setSessionId(null);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
  };

  // 格式化时间
  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // 音频事件处理
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      const current = audio.currentTime;
      setCurrentTime(current);
      
      // 定期更新播放进度
      if (current % 5 < 0.1) { // 每5秒更新一次
        updateProgress(current, audio.duration);
      }

      // 检查免费用户的播放限制
      const maxDuration = qualityOptions[quality].maxDuration;
      if (maxDuration && current >= maxDuration) {
        audio.pause();
        setIsPlaying(false);
        setError(`Preview limited to ${maxDuration} seconds. Upgrade for full access.`);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      endPlayback();
      if (onPlayComplete) {
        onPlayComplete(track.id);
      }
    };

    const handleError = () => {
      setError('Failed to load audio');
      setIsLoading(false);
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [sessionId, quality]);

  // 清理播放会话
  useEffect(() => {
    return () => {
      if (sessionId) {
        endPlayback();
      }
    };
  }, [sessionId]);

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;
  const maxDuration = qualityOptions[quality].maxDuration;

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <audio ref={audioRef} preload="metadata" />
      
      {/* 音轨信息 */}
      <div className="flex items-center mb-4">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold text-xl mr-4">
          {track.title.charAt(0)}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{track.title}</h3>
          <p className="text-gray-600">{track.artist}</p>
          <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
            <span>{track.genre}</span>
            <span>•</span>
            <span>{playCount} plays</span>
            {maxDuration && (
              <>
                <span>•</span>
                <span className="text-orange-500">Preview ({maxDuration}s)</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsLiked(!isLiked)}
            className={`p-2 rounded-full transition-colors ${
              isLiked ? 'text-red-500 bg-red-50' : 'text-gray-400 hover:text-red-500'
            }`}
          >
            <Heart className="w-5 h-5" fill={isLiked ? 'currentColor' : 'none'} />
          </button>
          <button 
            onClick={() => setShowShareModal(true)}
            className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
          >
            <Share2 className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-400 hover:text-green-500 transition-colors">
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* 进度条 */}
      <div className="mb-4">
        <div 
          ref={progressRef}
          className="w-full h-2 bg-gray-200 rounded-full cursor-pointer"
          onClick={handleProgressClick}
        >
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="flex justify-between text-sm text-gray-500 mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* 控制按钮 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <SkipBack className="w-5 h-5" />
          </button>
          
          <button
            onClick={togglePlayPause}
            disabled={isLoading}
            className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white hover:shadow-lg transition-all duration-300 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6 ml-1" />
            )}
          </button>
          
          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        {/* 音量控制 */}
        <div className="flex items-center space-x-2">
          <button onClick={toggleMute} className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-20 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* 设置按钮 */}
        <div className="relative">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
          
          {showSettings && (
            <div className="absolute right-0 bottom-full mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-48">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Audio Quality</h4>
              {getAvailableQualities().map((q) => (
                <button
                  key={q}
                  onClick={() => handleQualityChange(q)}
                  className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                    quality === q 
                      ? 'bg-purple-50 text-purple-700' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {qualityOptions[q].label}
                  {q === 'free' && userTier === 'free' && (
                    <span className="block text-xs text-gray-500">Current plan</span>
                  )}
                </button>
              ))}
              {userTier === 'free' && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Upgrade to Premium for full tracks and higher quality
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 社交分享模态框 */}
      <SocialShare 
        track={track}
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
    </div>
  );
};

export default AdvancedAudioPlayer;