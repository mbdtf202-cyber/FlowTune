import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Music, TrendingUp, Users, Play, Pause, BarChart3, Settings, Filter } from 'lucide-react';
import AdvancedAudioPlayer from '../components/AdvancedAudioPlayer';
import AudioAnalytics from '../components/AudioAnalytics';

const AudioLibrary = () => {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [activeTab, setActiveTab] = useState('library');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
    loadTracks();
  }, []);

  const loadUserData = async () => {
    try {
      const response = await window.fetch('http://localhost:3002/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData.data);
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const loadTracks = async () => {
    try {
      setLoading(true);
      const response = await window.fetch('http://localhost:3002/api/nfts/user-library', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const tracksData = await response.json();
        setTracks(tracksData.data || []);
      }
    } catch (error) {
      console.error('Failed to load tracks:', error);
      setTracks([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort tracks
  const getFilteredTracks = () => {
    let filtered = tracks;

    // Apply filters
    if (filter === 'owned') {
      filtered = filtered.filter(track => track.isOwned);
    } else if (filter === 'liked') {
      filtered = filtered.filter(track => track.isLiked);
    } else if (filter !== 'all') {
      filtered = filtered.filter(track => track.genre && track.genre.toLowerCase() === filter.toLowerCase());
    }

    // Apply sorting
    switch (sortBy) {
      case 'popular':
        filtered.sort((a, b) => b.plays - a.plays);
        break;
      case 'recent':
        filtered.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
        break;
      case 'alphabetical':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      default:
        break;
    }

    return filtered;
  };

  const handlePlayCountUpdate = (trackId) => {
    setTracks(prev => prev.map(track => 
      track.id === trackId 
        ? { ...track, plays: track.plays + 1 }
        : track
    ));
  };

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-200 rounded"></div>
                ))}
              </div>
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filteredTracks = getFilteredTracks();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('audioLibrary.title')}</h1>
          <p className="text-gray-600">
            {t('audioLibrary.description')}
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
          {[
            { id: 'library', label: t('audioLibrary.tabs.library'), icon: Music },
            { id: 'analytics', label: t('audioLibrary.tabs.analytics'), icon: BarChart3 }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-purple-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'library' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Track List */}
            <div className="lg:col-span-2">
              {/* Filter and Sort Controls */}
              <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Filter className="w-4 h-4 text-gray-500" />
                      <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                      >
                        <option value="all">{t('audioLibrary.filters.allTracks')}</option>
                        <option value="owned">{t('audioLibrary.filters.myTracks')}</option>
                        <option value="liked">{t('audioLibrary.filters.liked')}</option>
                        <option value="electronic">{t('audioLibrary.filters.electronic')}</option>
                        <option value="hip hop">{t('audioLibrary.filters.hipHop')}</option>
                        <option value="jazz">{t('audioLibrary.filters.jazz')}</option>
                      </select>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Settings className="w-4 h-4 text-gray-500" />
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                      >
                        <option value="recent">{t('audioLibrary.sort.mostRecent')}</option>
                        <option value="popular">{t('audioLibrary.sort.mostPopular')}</option>
                        <option value="alphabetical">{t('audioLibrary.sort.alphabetical')}</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    {filteredTracks.length} {t('audioLibrary.tracks')}
                  </div>
                </div>
              </div>

              {/* Track List */}
              <div className="space-y-4">
                {filteredTracks.map((track) => (
                  <div
                    key={track.id}
                    className={`bg-white rounded-lg shadow-sm p-4 transition-all duration-200 hover:shadow-md ${
                      currentTrack?.id === track.id ? 'ring-2 ring-purple-500' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => setCurrentTrack(track)}
                          className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white hover:shadow-lg transition-all duration-300"
                        >
                          {currentTrack?.id === track.id ? (
                            <Pause className="w-5 h-5" />
                          ) : (
                            <Play className="w-5 h-5 ml-1" />
                          )}
                        </button>
                        
                        <div>
                          <h3 className="font-semibold text-gray-900">{track.title}</h3>
                          <p className="text-gray-600 text-sm">{track.artist}</p>
                          <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
                            <span>{track.genre}</span>
                            <span>•</span>
                            <span>{formatDuration(track.duration)}</span>
                            <span>•</span>
                            <span>{track.plays.toLocaleString()} {t('audioLibrary.plays')}</span>
                            {track.isOwned && (
                              <>
                                <span>•</span>
                                <span className="text-green-600 font-medium">{t('audioLibrary.owned')}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          track.quality === 'hifi' 
                            ? 'bg-purple-100 text-purple-700'
                            : track.quality === 'premium'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {track.quality.toUpperCase()}
                        </span>
                        
                        <div className="flex items-center text-gray-500">
                          <TrendingUp className="w-4 h-4 mr-1" />
                          <span className="text-sm">{track.likes}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Current Player */}
            <div className="lg:col-span-1">
              <div className="sticky top-6">
                {currentTrack ? (
                  <AdvancedAudioPlayer
                    track={currentTrack}
                    userTier={user?.tier}
                    onPlayCountUpdate={handlePlayCountUpdate}
                    onPlayComplete={(trackId) => {
                      console.log('Track completed:', trackId);
                    }}
                  />
                ) : (
                  <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                    <Music className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('audioLibrary.noTrackSelected')}</h3>
                    <p className="text-gray-600 text-sm">
                      {t('audioLibrary.selectTrackToPlay')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Analytics Page */
          <AudioAnalytics artistId={user?.id} />
        )}
      </div>
    </div>
  );
};

export default AudioLibrary;