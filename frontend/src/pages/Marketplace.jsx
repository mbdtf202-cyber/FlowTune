import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { useRealTimeData } from '../hooks/useWebSocket'
import { cache } from '../services/cache'
import logger from '../services/logger.jsx'
import apiService from '../services/api'
import VirtualList from '../components/VirtualList'
import LazyImage from '../components/LazyImage'
import { 
  Search, 
  Filter, 
  Play, 
  Pause, 
  ShoppingCart, 
  Heart,
  Music,
  Clock,
  User,
  TrendingUp,
  Grid,
  List,
  SortAsc
} from 'lucide-react'

const Marketplace = () => {
  const { t } = useTranslation()
  const { isAuthenticated } = useAuth()
  const { marketUpdates, isConnected: wsConnected } = useRealTimeData()
  
  const [nfts, setNfts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const [playingId, setPlayingId] = useState(null)
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now())
  const [favorites, setFavorites] = useState(new Set())

  const genres = [t('marketplace.all'), 'Electronic', 'Hip Hop', 'Pop', 'Rock', 'Jazz', 'Classical', 'Ambient']
  const sortOptions = [
    { value: 'newest', label: t('marketplace.newestFirst') },
    { value: 'oldest', label: t('marketplace.oldestFirst') },
    { value: 'price_low', label: t('marketplace.priceLowToHigh') },
    { value: 'price_high', label: t('marketplace.priceHighToLow') },
    { value: 'popular', label: t('marketplace.mostPopular') }
  ]

  useEffect(() => {
    loadNFTs()
  }, [])

  // Listen for market real-time data updates
  useEffect(() => {
    if (marketUpdates && marketUpdates.length > 0) {
      logger.info('Received market updates', { count: marketUpdates.length })
      
      setNfts(prevNfts => {
        const updatedNfts = [...prevNfts]
        
        marketUpdates.forEach(update => {
          const index = updatedNfts.findIndex(nft => nft.id === update.id)
          
          if (update.type === 'listed' && index === -1) {
            // Newly listed NFT
            updatedNfts.unshift(update.data)
          } else if (update.type === 'price_updated' && index !== -1) {
            // Price update
            updatedNfts[index] = { ...updatedNfts[index], price: update.data.price }
          } else if (update.type === 'sold' && index !== -1) {
            // NFT sold, remove from marketplace
            updatedNfts.splice(index, 1)
          } else if (update.type === 'unlisted' && index !== -1) {
            // NFT unlisted
            updatedNfts.splice(index, 1)
          }
        })
        
        // Update cache
        cache.set('marketplace_nfts', updatedNfts, 3 * 60 * 1000) // 3-minute cache
        setLastUpdateTime(Date.now())
        
        return updatedNfts
      })
    }
  }, [marketUpdates])

  const loadNFTs = useCallback(async (forceRefresh = false) => {
    setLoading(true)
    const cacheKey = 'marketplace_nfts'
    
    try {
      // Try to get data from cache
      if (!forceRefresh) {
        const cachedData = cache.get(cacheKey)
        if (cachedData) {
          setNfts(cachedData)
          setLoading(false)
          logger.info('Loaded marketplace NFTs from cache', { count: cachedData.length })
          return
        }
      }

      const response = await apiService.getMarketNFTs(1, 100)
      const nfts = response.data || []
      setNfts(nfts)
      
      // Cache data, expires in 3 minutes
      cache.set(cacheKey, nfts, 3 * 60 * 1000)
      setLastUpdateTime(Date.now())
      logger.info('Loaded marketplace NFTs from API', { count: nfts.length })
    } catch (error) {
      logger.error('Failed to load marketplace NFTs', error)
      console.error('Failed to load NFTs:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Play control function
  const togglePlay = useCallback((nftId) => {
    if (playingId === nftId) {
      setPlayingId(null)
    } else {
      setPlayingId(nftId)
    }
  }, [playingId])

  // Favorite control function
  const toggleFavorite = useCallback((nftId) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(nftId)) {
        newFavorites.delete(nftId)
      } else {
        newFavorites.add(nftId)
      }
      return newFavorites
    })
  }, [])

  // Purchase handling function
  const handlePurchase = useCallback(async (nft) => {
    if (!isAuthenticated) {
      logger.warn('User not authenticated for purchase')
      return
    }
    
    try {
      logger.info('Initiating NFT purchase', { nftId: nft.id, price: nft.market?.price })
      // Actual purchase logic should be integrated here
      console.log('Purchase NFT:', nft)
    } catch (error) {
      logger.error('Failed to purchase NFT', error)
      console.error('Purchase failed:', error)
    }
  }, [isAuthenticated])

  // Price formatting function
  const formatPrice = useCallback((price) => {
    if (!price) return 'Free'
    return `${price} FLOW`
  }, [])

  // Duration formatting function
  const formatDuration = useCallback((seconds) => {
    if (!seconds) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }, [])

  // Address formatting function
  const formatAddress = useCallback((address) => {
    if (!address) return 'Unknown'
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }, [])

  // Optimize filtering and sorting logic using useMemo
  const filteredAndSortedNFTs = useMemo(() => {
    let filtered = nfts.filter(nft => {
      const matchesSearch = nft.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           nft.creator.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           nft.music?.genre?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesGenre = selectedGenre === 'all' || nft.music?.genre === selectedGenre
      return matchesSearch && matchesGenre
    })

    // Sorting logic
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return (a.market?.price || 0) - (b.market?.price || 0)
        case 'price-high':
          return (b.market?.price || 0) - (a.market?.price || 0)
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt)
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt)
        case 'popular':
          return (b.analytics?.plays || 0) - (a.analytics?.plays || 0)
        default:
          return 0
      }
    })

    return filtered
  }, [nfts, searchTerm, selectedGenre, sortBy])

  // Grid view NFT card rendering function
  const renderGridItem = useCallback(({ item: nft, index }) => (
    <div key={nft.id} className="card group hover:shadow-xl transition-all duration-300">
      {/* Cover Image */}
      <div className="relative aspect-square bg-gradient-to-br from-primary-100 to-secondary-100 rounded-lg mb-3 sm:mb-4 overflow-hidden">
        {nft.coverImage ? (
          <LazyImage
            src={nft.coverImage}
            alt={nft.title}
            className="w-full h-full"
            placeholder="/placeholder-music.jpg"
          />
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-secondary-500/20"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Music className="h-12 w-12 sm:h-16 sm:w-16 text-primary-600/50" />
            </div>
          </>
        )}
        
        {/* Play Button Overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <button
            onClick={() => togglePlay(nft.id)}
            className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-200 min-h-[48px] touch-target"
          >
            {playingId === nft.id ? (
              <Pause className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600" />
            ) : (
              <Play className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600 ml-1" />
            )}
          </button>
        </div>

        {/* Favorite Button */}
        <button
          onClick={() => toggleFavorite(nft.id)}
          className="absolute top-2 sm:top-3 right-2 sm:right-3 w-8 h-8 sm:w-10 sm:h-10 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors duration-200 min-h-[40px] min-w-[40px] touch-target"
        >
          <Heart 
            className={`h-4 w-4 ${favorites.has(nft.id) ? 'text-red-500 fill-current' : 'text-gray-600'}`} 
          />
        </button>
      </div>

      {/* NFT Info */}
      <div className="space-y-2 sm:space-y-3 p-1">
        <div>
          <h3 className="font-semibold text-gray-900 truncate text-sm sm:text-base">{nft.title}</h3>
          <p className="text-xs sm:text-sm text-gray-600 truncate">{nft.creator}</p>
        </div>

        <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>{formatDuration(nft.music?.duration)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <TrendingUp className="h-3 w-3" />
            <span className="hidden sm:inline">{(nft.analytics?.plays || 0).toLocaleString()} {t('marketplace.plays')}</span>
            <span className="sm:hidden">{(nft.analytics?.plays || 0).toLocaleString()}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1 mr-2">
            <div className="text-sm sm:text-lg font-bold text-gray-900 truncate">
              {nft.market?.price} {nft.market?.currency}
            </div>
            <div className="text-xs text-gray-500 truncate">
              by {formatAddress(nft.owner)}
            </div>
          </div>
          
          <button
            onClick={() => handlePurchase(nft)}
            className="btn-primary flex items-center justify-center space-x-1 text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2 min-h-[40px] flex-shrink-0 touch-target"
          >
            <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">{t('marketplace.buy')}</span>
          </button>
        </div>
      </div>
    </div>
  ), [playingId, favorites, togglePlay, toggleFavorite, handlePurchase, formatDuration, formatAddress, t])

  // List view NFT item rendering function
  const renderListItem = useCallback(({ item: nft, index }) => (
    <div key={nft.id} className="card">
      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* Cover Image */}
        <div className="relative w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-lg flex-shrink-0 overflow-hidden">
          {nft.coverImage ? (
            <LazyImage
              src={nft.coverImage}
              alt={nft.title}
              className="w-full h-full"
              placeholder="/placeholder-music.jpg"
            />
          ) : (
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-secondary-500/20"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Music className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600/50" />
              </div>
            </>
          )}
          
          <button
            onClick={() => togglePlay(nft.id)}
            className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center min-h-[48px] touch-target"
          >
            {playingId === nft.id ? (
              <Pause className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
            ) : (
              <Play className="h-4 w-4 sm:h-6 sm:w-6 text-white ml-0.5" />
            )}
          </button>
        </div>

        {/* NFT Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1 mr-2">
              <h3 className="font-semibold text-gray-900 truncate text-sm sm:text-base">{nft.title}</h3>
              <p className="text-xs sm:text-sm text-gray-600 truncate">{nft.creator}</p>
              <div className="flex items-center space-x-2 sm:space-x-4 mt-1 text-xs text-gray-500">
                <span className="truncate">{nft.music?.genre}</span>
                <span>{formatDuration(nft.music?.duration)}</span>
                <span className="hidden sm:inline">{(nft.analytics?.plays || 0).toLocaleString()} plays</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              <button
                onClick={() => toggleFavorite(nft.id)}
                className="p-2 hover:bg-gray-50 rounded-lg transition-colors duration-200 min-h-[40px] min-w-[40px] touch-target"
              >
                <Heart 
                  className={`h-4 w-4 ${favorites.has(nft.id) ? 'text-red-500 fill-current' : 'text-gray-400'}`} 
                />
              </button>
              
              <div className="text-right min-w-0">
                <div className="text-sm sm:text-lg font-bold text-gray-900 truncate">
                  {nft.market?.price} {nft.market?.currency}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  by {formatAddress(nft.owner)}
                </div>
              </div>
              
              <button
                onClick={() => handlePurchase(nft)}
                className="btn-primary flex items-center justify-center space-x-1 text-xs sm:text-sm px-3 sm:px-4 py-2 min-h-[40px] flex-shrink-0 touch-target"
              >
                <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Buy</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  ), [playingId, favorites, togglePlay, toggleFavorite, handlePurchase, formatDuration, formatAddress])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('marketplace.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-8">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('marketplace.title')}</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">{t('marketplace.description')}</p>
            </div>
            
            <div className="mt-4 md:mt-0 flex items-center justify-between sm:justify-end space-x-4">
              <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
                <Music className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>{nfts.length} {t('marketplace.nftsAvailable')}</span>
              </div>
              
              <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded min-h-[40px] min-w-[40px] ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
                >
                  <Grid className="h-3 w-3 sm:h-4 sm:w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded min-h-[40px] min-w-[40px] ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
                >
                  <List className="h-3 w-3 sm:h-4 sm:w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col space-y-3 sm:space-y-4 md:space-y-0 md:flex-row md:items-center md:space-x-6">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={t('marketplace.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
              />
            </div>

            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              {/* Genre Filter */}
              <div className="flex items-center space-x-2 min-w-0">
                <Filter className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <select
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm min-w-[120px] flex-1 sm:flex-none"
                >
                  {genres.map(genre => (
                    <option key={genre} value={genre === 'All' ? '' : genre}>
                      {genre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div className="flex items-center space-x-2 min-w-0">
                <SortAsc className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm min-w-[120px] flex-1 sm:flex-none"
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* NFT Grid/List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {filteredAndSortedNFTs.length === 0 ? (
          <div className="text-center py-12">
            <Music className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No NFTs found</h3>
            <p className="text-sm sm:text-base text-gray-600 px-4">Try adjusting your search or filter criteria</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {/* 对于少量NFT使用普通渲染，大量NFT使用虚拟滚动 */}
            {filteredAndSortedNFTs.length <= 20 ? (
              filteredAndSortedNFTs.map((nft, index) => renderGridItem({ item: nft, index }))
            ) : (
              <div className="col-span-full">
                <VirtualList
                  items={filteredAndSortedNFTs}
                  itemHeight={320} // 网格项目高度
                  containerHeight={800} // 容器高度
                  renderItem={renderGridItem}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
                  overscan={10} // 预渲染更多项目以提升滚动体验
                />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {/* 对于少量NFT使用普通渲染，大量NFT使用虚拟滚动 */}
            {filteredAndSortedNFTs.length <= 50 ? (
              filteredAndSortedNFTs.map((nft, index) => renderListItem({ item: nft, index }))
            ) : (
              <VirtualList
                items={filteredAndSortedNFTs}
                itemHeight={100} // 列表项目高度
                containerHeight={800} // 容器高度
                renderItem={renderListItem}
                className="space-y-3 sm:space-y-4"
                overscan={15} // 预渲染更多项目
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Marketplace