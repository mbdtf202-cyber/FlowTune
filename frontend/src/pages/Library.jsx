import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import { useNotification } from '../components/Notification'
import apiService from '../services/api'
import MusicCard from '../components/MusicCard'
import { 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Heart,
  Clock,
  Music,
  Folder,
  Plus
} from 'lucide-react'

const Library = () => {
  const { isAuthenticated, user } = useAuth()
  const { t } = useTranslation()
  const { showNotification } = useNotification()
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null)
  const [musicLibrary, setMusicLibrary] = useState([])
  const [playlists, setPlaylists] = useState([])
  const [loading, setLoading] = useState(true)

  // Load data when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadLibraryData()
    } else {
      setLoading(false)
    }
  }, [isAuthenticated])

  const loadLibraryData = async () => {
    setLoading(true)
    try {
      // Load music library
      const musicData = await apiService.request('/nft/user-library');
      setMusicLibrary(musicData.data || []);

      // Load playlists
      const playlistsData = await apiService.request('/playlists/user');
      setPlaylists(playlistsData.data || []);
    } catch (error) {
      console.error('Failed to load library data:', error);
    } finally {
      setLoading(false);
    }
  }

  const filters = [
    { id: 'all', label: t('library.filters.allMusic'), icon: Music },
    { id: 'liked', label: t('library.filters.liked'), icon: Heart },
    { id: 'recent', label: t('library.filters.recent'), icon: Clock },
    { id: 'playlists', label: t('library.filters.playlists'), icon: Folder }
  ]

  const filteredMusic = musicLibrary.filter(track => {
    const matchesSearch = track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         track.artist.toLowerCase().includes(searchQuery.toLowerCase())
    
    switch (selectedFilter) {
      case 'liked':
        return matchesSearch && track.isLiked
      case 'recent':
        return matchesSearch // Could add date filtering logic
      default:
        return matchesSearch
    }
  })

  const handlePlay = (trackId) => {
    setCurrentlyPlaying(trackId)
    showNotification(t('library.notifications.playingTrack'), 'success')
  }

  const handlePause = () => {
    setCurrentlyPlaying(null)
  }

  const handleLike = (trackId) => {
    setMusicLibrary(prev => 
      prev.map(track => 
        track.id === trackId 
          ? { ...track, isLiked: !track.isLiked }
          : track
      )
    )
    showNotification(t('library.notifications.addedToFavorites'), 'success')
  }

  const handleShare = (track) => {
    navigator.clipboard.writeText(`Check out "${track.title}" by ${track.artist}`)
    showNotification(t('library.notifications.linkCopied'), 'success')
  }

  const handleDownload = (track) => {
    showNotification(t('library.notifications.downloadStarted'), 'success')
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <Music className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('library.connectWallet')}</h2>
          <p className="text-gray-600 mb-6">
            {t('library.connectWalletDesc')}
          </p>
          <button className="btn-primary">
            {t('library.connectWalletButton')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            {t('library.title')}
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            {t('library.description')}
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('library.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2">
            {filters.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setSelectedFilter(id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedFilter === id
                    ? 'bg-primary-100 text-primary-700 border border-primary-200'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* View Mode and Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg ${
                  viewMode === 'grid' 
                    ? 'bg-primary-100 text-primary-700' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Grid3X3 className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg ${
                  viewMode === 'list' 
                    ? 'bg-primary-100 text-primary-700' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <List className="h-5 w-5" />
              </button>
            </div>

            <button className="btn-secondary flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">{t('library.createPlaylist')}</span>
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : selectedFilter === 'playlists' ? (
          /* Playlists View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {playlists.map((playlist) => (
              <div key={playlist.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg mb-4">
                  <Folder className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{playlist.name}</h3>
                <p className="text-sm text-gray-600">{playlist.count} {t('library.tracks')}</p>
              </div>
            ))}
          </div>
        ) : (
          /* Music Library */
          <div className={
            viewMode === 'grid' 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
              : "space-y-4"
          }>
            {filteredMusic.length > 0 ? (
              filteredMusic.map((track) => (
                <MusicCard
                  key={track.id}
                  title={track.title}
                  artist={track.artist}
                  duration={track.duration}
                  coverImage={track.coverImage}
                  isPlaying={currentlyPlaying === track.id}
                  isLiked={track.isLiked}
                  onPlay={() => handlePlay(track.id)}
                  onPause={handlePause}
                  onLike={() => handleLike(track.id)}
                  onShare={() => handleShare(track)}
                  onDownload={() => handleDownload(track)}
                  className={viewMode === 'list' ? 'flex flex-row' : ''}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <Music className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t('library.noMusicFound')}</h3>
                <p className="text-gray-600 mb-6">
                  {searchQuery ? t('library.adjustSearchTerms') : t('library.startCreatingMusic')}
                </p>
                <button className="btn-primary">
                  {t('library.createMusic')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Library