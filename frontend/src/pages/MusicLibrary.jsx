import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useAudio } from '../contexts/AudioContext'
import { useTranslation } from 'react-i18next'
import { useNotification } from '../components/Notification'
import EditNFTForm from '../components/EditNFTForm'
import ShareModal from '../components/ShareModal'
import VirtualList from '../components/VirtualList'
import { useRealTimeData } from '../hooks/useWebSocket'
import { cache } from '../services/cache'
import logger from '../services/logger.jsx'
import apiService from '../services/api'
import { 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Heart,
  Clock,
  Music,
  Play,
  Pause,
  Download,
  Share2,
  Edit3,
  Trash2,
  Eye,
  TrendingUp,
  Coins,
  Calendar,
  User,
  Tag,
  Volume2,
  MoreHorizontal,
  Plus,
  Upload,
  Sparkles
} from 'lucide-react'

const MusicLibrary = () => {
  const { isAuthenticated, user } = useAuth()
  const { playTrack, currentTrack, isPlaying } = useAudio()
  const { t } = useTranslation()
  const { showNotification } = useNotification()
  
  // Real-time data updates
  const { nftUpdates, isConnected: wsConnected } = useRealTimeData()
  
  // State management
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const [searchQuery, setSearchQuery] = useState('')
  const [filterGenre, setFilterGenre] = useState('all')
  const [selectedFilter, setSelectedFilter] = useState('all') // Add missing state
  const [sortBy, setSortBy] = useState('newest')
  const [musicNFTs, setMusicNFTs] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedNFT, setSelectedNFT] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingNFT, setEditingNFT] = useState(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const [sharingNFT, setSharingNFT] = useState(null)
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now())

  // Load user's music NFTs
  useEffect(() => {
    if (isAuthenticated) {
      loadMusicNFTs()
    } else {
      setLoading(false)
    }
  }, [isAuthenticated])

  // Listen for real-time data updates
  useEffect(() => {
    if (nftUpdates && nftUpdates.length > 0) {
      logger.info('Received NFT updates', { count: nftUpdates.length })
      
      setMusicNFTs(prevNFTs => {
        const updatedNFTs = [...prevNFTs]
        
        nftUpdates.forEach(update => {
          const index = updatedNFTs.findIndex(nft => nft.id === update.id)
          
          if (update.type === 'created' && index === -1) {
            // Newly created NFT
            updatedNFTs.unshift(update.data)
            showNotification(t('musicLibrary.notifications.newNFTCreated'), 'success')
          } else if (update.type === 'updated' && index !== -1) {
            // Update existing NFT
            updatedNFTs[index] = { ...updatedNFTs[index], ...update.data }
            showNotification(t('musicLibrary.notifications.nftUpdated'), 'info')
          } else if (update.type === 'deleted' && index !== -1) {
            // Delete NFT
            updatedNFTs.splice(index, 1)
            showNotification(t('musicLibrary.notifications.nftDeleted'), 'info')
          } else if (update.type === 'sold' && index !== -1) {
            // NFT was sold
            updatedNFTs[index] = { ...updatedNFTs[index], isForSale: false, owner: update.data.newOwner }
            if (update.data.seller === user?.address) {
              showNotification(t('musicLibrary.notifications.nftSold'), 'success')
            }
          }
        })
        
        // Update cache
        const cacheKey = `user_nfts_${user?.address || 'anonymous'}`
        cache.set(cacheKey, updatedNFTs, 5 * 60 * 1000)
        setLastUpdateTime(Date.now())
        
        return updatedNFTs
      })
    }
  }, [nftUpdates, user?.address, showNotification, t])

  const loadMusicNFTs = useCallback(async (forceRefresh = false) => {
    setLoading(true)
    const cacheKey = `user_nfts_${user?.address || 'anonymous'}`
    
    try {
      // Try to get data from cache
      if (!forceRefresh) {
        const cachedData = cache.get(cacheKey)
        if (cachedData) {
          setMusicNFTs(cachedData)
          setLoading(false)
          logger.info('Loaded NFTs from cache', { count: cachedData.length })
          return
        }
      }

      // Get user's music NFT library
      const response = await apiService.getUserNFTs(user?.address, 1, 50)
      
      if (response.success && response.data) {
        const nfts = response.data.nfts || []
        setMusicNFTs(nfts)
        // Cache data, expires in 5 minutes
        cache.set(cacheKey, nfts, 5 * 60 * 1000)
        setLastUpdateTime(Date.now())
        logger.info('Loaded NFTs from API', { count: nfts.length })
      } else {
        throw new Error('Failed to fetch user NFTs')
      }
    } catch (error) {
      logger.error('Failed to load music NFTs', error, { userId: user?.address })
      showNotification(t('musicLibrary.notifications.loadFailed'), 'error')
      // Load mock data for demo
      const mockData = getMockMusicNFTs()
      setMusicNFTs(mockData)
      cache.set(cacheKey, mockData, 60 * 1000) // Cache for 1 minute
    } finally {
      setLoading(false)
    }
  }, [user?.address, showNotification, t])

  // Mock data for demo
  const getMockMusicNFTs = () => [
    {
      id: '1',
      tokenId: '001',
      title: 'AI Symphony No.1',
      artist: 'AI Composer',
      description: 'A beautiful AI-generated symphony',
      genre: 'Classical',
      duration: 180,
      coverImage: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
      audioUrl: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
      price: '5.0',
      currency: 'FLOW',
      isForSale: true,
      playCount: 1234,
      likes: 89,
      createdAt: '2024-01-15T10:00:00Z',
      creator: user?.address || '0x123...',
      owner: user?.address || '0x123...',
      isCreatedByUser: true,
      isOwnedByUser: true,
      isFavorite: true,
      blockchain: {
        transactionHash: '0xabc123...',
        blockNumber: 12345
      },
      analytics: {
        views: 2345,
        totalEarnings: '12.5'
      }
    },
    {
      id: '2',
      tokenId: '002',
      title: 'Electronic Dreams',
      artist: 'Digital Artist',
      description: 'Futuristic electronic music',
      genre: 'Electronic',
      duration: 240,
      coverImage: 'https://images.unsplash.com/photo-1571974599782-87624638275c?w=400',
      audioUrl: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
      price: '3.0',
      currency: 'FLOW',
      isForSale: false,
      playCount: 567,
      likes: 45,
      createdAt: '2024-01-10T15:30:00Z',
      creator: '0x456...',
      owner: user?.address || '0x123...',
      isCreatedByUser: false,
      isOwnedByUser: true,
      isFavorite: false,
      blockchain: {
        transactionHash: '0xdef456...',
        blockNumber: 12340
      },
      analytics: {
        views: 890,
        totalEarnings: '0'
      }
    }
  ]

  // Filter and sort NFTs - Use useMemo for performance optimization
  const filteredAndSortedNFTs = useMemo(() => {
    return musicNFTs
      .filter(nft => {
        // Search filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase()
          if (!nft.title.toLowerCase().includes(query) && 
              !nft.artist.toLowerCase().includes(query) &&
              !nft.genre.toLowerCase().includes(query)) {
            return false
          }
        }
        
        // Category filter
        switch (selectedFilter) {
          case 'created':
            return nft.isCreatedByUser
          case 'owned':
            return nft.isOwnedByUser && !nft.isCreatedByUser
          case 'favorites':
            return nft.isFavorite
          default:
            return true
        }
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'popular':
            return b.playCount - a.playCount
          case 'alphabetical':
            return a.title.localeCompare(b.title)
          case 'duration':
            return b.duration - a.duration
          default: // recent
            return new Date(b.createdAt) - new Date(a.createdAt)
        }
      })
  }, [musicNFTs, searchQuery, selectedFilter, sortBy])

  const handlePlay = useCallback(async (nft) => {
    try {
      // 记录播放次数
      await apiService.playNFT(nft.id)
      
      // 使用音频上下文播放音乐
      await playTrack(nft, filteredAndSortedNFTs)
      
      showNotification(`${t('musicLibrary.notifications.playingTrack')}: ${nft.title}`, 'success')
      
      // 更新本地播放次数
      setMusicNFTs(prev => prev.map(n => 
        n.id === nft.id ? { ...n, playCount: (n.playCount || 0) + 1 } : n
      ))
    } catch (error) {
      console.error('Failed to record play:', error)
      // 即使记录失败也继续播放
      await playTrack(nft, filteredAndSortedNFTs)
      showNotification(`${t('musicLibrary.notifications.playingTrack')}: ${nft.title}`, 'success')
    }
  }, [filteredAndSortedNFTs, playTrack, showNotification, t])

  const handleLike = useCallback(async (nft) => {
    try {
      await apiService.likeNFT(nft.id)
      setMusicNFTs(prev => prev.map(n => 
        n.id === nft.id ? { ...n, isFavorite: !n.isFavorite, likes: n.likes + (n.isFavorite ? -1 : 1) } : n
      ))
      showNotification(t('musicLibrary.notifications.addedToFavorites'), 'success')
    } catch (error) {
      console.error('Failed to like NFT:', error)
    }
  }, [showNotification, t])

  const handleShare = useCallback((nft) => {
    setSharingNFT(nft)
    setShowShareModal(true)
  }, [])

  const handleEdit = useCallback((nft) => {
    setEditingNFT(nft)
    setShowEditModal(true)
  }, [])

  const handleDelete = useCallback(async (nft) => {
    if (window.confirm(t('musicLibrary.confirmDelete'))) {
      try {
        const response = await apiService.deleteNFT(nft.id)
        
        if (response.success) {
          // Remove from local state
          setMusicNFTs(prev => prev.filter(n => n.id !== nft.id))
          showNotification(t('musicLibrary.notifications.deleteSuccess'), 'success')
        } else {
          throw new Error('Failed to delete NFT')
        }
      } catch (error) {
        console.error('Failed to delete NFT:', error)
        showNotification(t('musicLibrary.notifications.deleteFailed'), 'error')
      }
    }
  }, [t, showNotification])

  const handleDownload = useCallback(async (nft) => {
    try {
      // Check if user owns this NFT or if it's free to download
      if (nft.creator !== user?.address && nft.price > 0) {
        showNotification(t('musicLibrary.notifications.downloadNotAllowed'), 'error')
        return
      }

      if (!nft.audioUrl) {
        showNotification(t('musicLibrary.notifications.noAudioFile'), 'error')
        return
      }

      // Create download link
      const link = document.createElement('a')
      link.href = nft.audioUrl
      link.download = `${nft.title} - ${nft.artist}.mp3`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      showNotification(t('musicLibrary.notifications.downloadStarted'), 'success')
    } catch (error) {
      console.error('Download failed:', error)
      showNotification(t('musicLibrary.notifications.downloadFailed'), 'error')
    }
  }, [user?.address, t, showNotification])

  const handleViewDetails = useCallback((nft) => {
    setSelectedNFT(nft)
    setShowDetailsModal(true)
  }, [])

  // 渲染列表项的函数
  const renderListItem = useCallback((nft, index) => (
    <tr key={nft.id} className="hover:bg-gray-50 border-b border-gray-200">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-12 w-12 relative">
            <img
              src={nft.coverImage}
              alt={nft.title}
              className="h-12 w-12 rounded-lg object-cover"
            />
            <button
              onClick={() => handlePlay(nft)}
              className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-50 rounded-lg flex items-center justify-center transition-all"
            >
              {currentTrack?.id === nft.id && isPlaying ? (
                <Pause className="w-4 h-4 text-white opacity-0 hover:opacity-100" />
              ) : (
                <Play className="w-4 h-4 text-white opacity-0 hover:opacity-100 ml-0.5" />
              )}
            </button>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{nft.title}</div>
            <div className="text-sm text-gray-500">{nft.artist}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {nft.genre}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {formatDuration(nft.duration)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {nft.playCount.toLocaleString()}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {formatDate(nft.createdAt)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <div className="flex space-x-2">
          {nft.isCreatedByUser && (
            <>
              <button
                onClick={() => handleEdit(nft)}
                className="text-gray-400 hover:text-blue-600"
                title={t('musicLibrary.edit')}
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(nft)}
                className="text-gray-400 hover:text-red-600"
                title={t('musicLibrary.delete')}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
          <button
            onClick={() => handleLike(nft)}
            className="text-gray-400 hover:text-red-500"
            title={t('musicLibrary.like')}
          >
            <Heart className={`w-4 h-4 ${nft.isFavorite ? 'text-red-500 fill-current' : ''}`} />
          </button>
          <button
            onClick={() => handleShare(nft)}
            className="text-gray-400 hover:text-blue-500"
            title={t('musicLibrary.share')}
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDownload(nft)}
            className="text-gray-400 hover:text-green-500"
            title={t('musicLibrary.download')}
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleViewDetails(nft)}
            className="text-gray-400 hover:text-gray-600"
            title={t('musicLibrary.viewDetails')}
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  ), [currentTrack, isPlaying, handlePlay, handleEdit, handleDelete, handleLike, handleShare, handleDownload, handleViewDetails, t])




  const handleSaveEdit = async (updatedData) => {
    try {
      // 调用API更新NFT元数据
      const response = await apiService.updateNFT(editingNFT.id, updatedData)
      
      if (response.success) {
        // 更新本地状态
        setMusicNFTs(prev => prev.map(nft => 
          nft.id === editingNFT.id ? { ...nft, ...updatedData } : nft
        ))
        setShowEditModal(false)
        setEditingNFT(null)
        showNotification(t('musicLibrary.notifications.updateSuccess'), 'success')
      } else {
        throw new Error('Failed to update NFT')
      }
    } catch (error) {
      console.error('Failed to update NFT:', error)
      showNotification(t('musicLibrary.notifications.updateFailed'), 'error')
    }
  }



  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto px-4">
          <Music className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {t('musicLibrary.connectWallet')}
          </h2>
          <p className="text-gray-600 mb-6">
            {t('musicLibrary.connectWalletDescription')}
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('musicLibrary.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {t('musicLibrary.title')}
              </h1>
              <p className="text-gray-600 mt-1">
                {t('musicLibrary.description')}
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => window.location.href = '/create'}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('musicLibrary.createNew')}
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder={t('musicLibrary.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filters and Controls */}
            <div className="flex items-center space-x-4">
              {/* Category Filter */}
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">{t('musicLibrary.filters.all')}</option>
                <option value="created">{t('musicLibrary.filters.created')}</option>
                <option value="owned">{t('musicLibrary.filters.owned')}</option>
                <option value="favorites">{t('musicLibrary.filters.favorites')}</option>
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="recent">{t('musicLibrary.sort.recent')}</option>
                <option value="popular">{t('musicLibrary.sort.popular')}</option>
                <option value="alphabetical">{t('musicLibrary.sort.alphabetical')}</option>
                <option value="duration">{t('musicLibrary.sort.duration')}</option>
              </select>

              {/* View Mode */}
              <div className="flex border border-gray-300 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-4 text-sm text-gray-600">
            {filteredAndSortedNFTs.length} {t('musicLibrary.tracks')}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {filteredAndSortedNFTs.length === 0 ? (
          <div className="text-center py-12">
            <Music className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? t('musicLibrary.noResults') : t('musicLibrary.noMusic')}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery ? t('musicLibrary.tryDifferentSearch') : t('musicLibrary.startCreating')}
            </p>
            {!searchQuery && (
              <button
                onClick={() => window.location.href = '/create'}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center mx-auto"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                {t('musicLibrary.createFirst')}
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Grid View */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredAndSortedNFTs.map((nft) => (
                  <div key={nft.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                    {/* Cover Image */}
                    <div className="relative aspect-square">
                      <img
                        src={nft.coverImage}
                        alt={nft.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                        <button
                          onClick={() => handlePlay(nft)}
                          className="opacity-0 hover:opacity-100 bg-white rounded-full p-3 shadow-lg transition-all duration-200 transform hover:scale-110"
                        >
                          {currentTrack?.id === nft.id && isPlaying ? (
                            <Pause className="w-6 h-6 text-gray-900" />
                          ) : (
                            <Play className="w-6 h-6 text-gray-900 ml-1" />
                          )}
                        </button>
                      </div>
                      
                      {/* Badges */}
                      <div className="absolute top-2 left-2 flex space-x-1">
                        {nft.isCreatedByUser && (
                          <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                            {t('musicLibrary.badges.created')}
                          </span>
                        )}
                        {nft.isForSale && (
                          <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                            {t('musicLibrary.badges.forSale')}
                          </span>
                        )}
                      </div>

                      {/* Like Button */}
                      <button
                        onClick={() => handleLike(nft)}
                        className="absolute top-2 right-2 p-2 bg-white bg-opacity-80 rounded-full hover:bg-opacity-100 transition-all"
                      >
                        <Heart className={`w-4 h-4 ${nft.isFavorite ? 'text-red-500 fill-current' : 'text-gray-600'}`} />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 truncate">{nft.title}</h3>
                      <p className="text-sm text-gray-600 truncate">{nft.artist}</p>
                      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatDuration(nft.duration)}
                        </span>
                        <span className="flex items-center">
                          <Volume2 className="w-3 h-3 mr-1" />
                          {nft.playCount}
                        </span>
                      </div>
                      
                      {/* Price */}
                      {nft.isForSale && (
                        <div className="mt-2 flex items-center text-sm font-medium text-blue-600">
                          <Coins className="w-4 h-4 mr-1" />
                          {nft.price} {nft.currency}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="mt-3 flex items-center justify-between">
                        <button
                          onClick={() => handleViewDetails(nft)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          {t('musicLibrary.viewDetails')}
                        </button>
                        <div className="flex space-x-1">
                          {nft.isCreatedByUser && (
                            <>
                              <button
                                onClick={() => handleEdit(nft)}
                                className="p-1 text-gray-400 hover:text-blue-600"
                                title={t('musicLibrary.edit')}
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(nft)}
                                className="p-1 text-gray-400 hover:text-red-600"
                                title={t('musicLibrary.delete')}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleShare(nft)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title={t('musicLibrary.share')}
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDownload(nft)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title={t('musicLibrary.download')}
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* List View with Virtual Scrolling */}
            {viewMode === 'list' && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('musicLibrary.table.track')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('musicLibrary.table.genre')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('musicLibrary.table.duration')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('musicLibrary.table.plays')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('musicLibrary.table.date')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('musicLibrary.table.actions')}
                        </th>
                      </tr>
                    </thead>
                  </table>
                  
                  {/* Virtual scrolling table body */}
                  <VirtualList
                    items={filteredAndSortedNFTs}
                    itemHeight={80}
                    containerHeight={600}
                    renderItem={renderListItem}
                    className="bg-white"
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>



      {/* NFT Details Modal */}
      {showDetailsModal && selectedNFT && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{selectedNFT.title}</h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <MoreHorizontal className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Cover Image */}
                <div>
                  <img
                    src={selectedNFT.coverImage}
                    alt={selectedNFT.title}
                    className="w-full aspect-square object-cover rounded-lg"
                  />
                </div>

                {/* Details */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{selectedNFT.title}</h3>
                    <p className="text-gray-600">{selectedNFT.artist}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">{t('musicLibrary.details.genre')}:</span>
                      <p className="font-medium">{selectedNFT.genre}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">{t('musicLibrary.details.duration')}:</span>
                      <p className="font-medium">{formatDuration(selectedNFT.duration)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">{t('musicLibrary.details.plays')}:</span>
                      <p className="font-medium">{selectedNFT.playCount.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">{t('musicLibrary.details.likes')}:</span>
                      <p className="font-medium">{selectedNFT.likes}</p>
                    </div>
                  </div>

                  {selectedNFT.description && (
                    <div>
                      <span className="text-gray-500 text-sm">{t('musicLibrary.details.description')}:</span>
                      <p className="text-gray-900 mt-1">{selectedNFT.description}</p>
                    </div>
                  )}

                  {/* Blockchain Info */}
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-2">{t('musicLibrary.details.blockchain')}</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-500">{t('musicLibrary.details.tokenId')}:</span>
                        <p className="font-mono">{selectedNFT.tokenId}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">{t('musicLibrary.details.transaction')}:</span>
                        <p className="font-mono text-xs break-all">{selectedNFT.blockchain.transactionHash}</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={() => handlePlay(selectedNFT)}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                    >
                      {currentTrack?.id === selectedNFT.id && isPlaying ? (
                        <>
                          <Pause className="w-4 h-4 mr-2" />
                          {t('musicLibrary.pause')}
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          {t('musicLibrary.play')}
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleShare(selectedNFT)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDownload(selectedNFT)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingNFT && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {t('musicLibrary.editNFT')}
                </h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <EditNFTForm
                nft={editingNFT}
                onSave={handleSaveEdit}
                onCancel={() => setShowEditModal(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        nft={sharingNFT}
      />
    </div>
  )
}

export default MusicLibrary