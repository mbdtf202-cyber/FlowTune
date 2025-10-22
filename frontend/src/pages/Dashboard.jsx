import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import { 
  Music, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Play,
  Eye,
  Heart,
  MoreVertical,
  Edit,
  Share,
  Trash2,
  Plus,
  Calendar,
  BarChart3
} from 'lucide-react'
import { Link } from 'react-router-dom'
import ActivityStream from '../components/ActivityStream'
import RealTimeStats from '../components/RealTimeStats'

const Dashboard = () => {
  const { isAuthenticated, user } = useAuth()
  const { t } = useTranslation()
  const [userNFTs, setUserNFTs] = useState([])
  const [stats, setStats] = useState({
    totalNFTs: 0,
    totalEarnings: 0,
    totalPlays: 0,
    totalLikes: 0
  })
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('7d')



  useEffect(() => {
    if (isAuthenticated) {
      loadUserData()
    }
  }, [isAuthenticated])

  const loadUserData = useCallback(async () => {
    setLoading(true)
    try {
      // Get user NFT data
      const nftsResponse = await window.fetch('http://localhost:3002/api/nfts/user-dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (nftsResponse.ok) {
        const nftsData = await nftsResponse.json();
        const userNFTsData = nftsData.data || [];
        setUserNFTs(userNFTsData);
        
        // Calculate statistics
        const totalNFTs = userNFTsData.length;
        const totalPlays = userNFTsData.reduce((sum, nft) => sum + (nft.plays || 0), 0);
        const totalLikes = userNFTsData.reduce((sum, nft) => sum + (nft.likes || 0), 0);
        const totalEarnings = userNFTsData.reduce((sum, nft) => sum + parseFloat(nft.earnings || 0), 0);
        
        setStats({
          totalNFTs,
          totalEarnings: totalEarnings.toFixed(2),
          totalPlays,
          totalLikes
        });
      }
    } catch (error) {
      console.error('Failed to load user data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const getStatusColor = useCallback((status) => {
    switch (status) {
      case 'listed':
        return 'bg-green-100 text-green-800'
      case 'unlisted':
        return 'bg-yellow-100 text-yellow-800'
      case 'sold':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }, [])

  const getStatusText = useCallback((status) => {
    switch (status) {
      case 'listed':
        return t('dashboard.status.listed')
      case 'unlisted':
        return t('dashboard.status.unlisted')
      case 'sold':
        return t('dashboard.status.sold')
      default:
        return t('dashboard.status.unknown')
    }
  }, [t])

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('dashboard.connectWallet')}</h2>
          <p className="text-gray-600">{t('dashboard.connectWalletDesc')}</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('dashboard.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('dashboard.title')}</h1>
            <p className="text-gray-600 mt-1">{t('dashboard.description')}</p>
          </div>
          
          <div className="mt-4 md:mt-0 flex items-center space-x-4">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="7d">{t('dashboard.periods.last7Days')}</option>
              <option value="30d">{t('dashboard.periods.last30Days')}</option>
              <option value="90d">{t('dashboard.periods.last90Days')}</option>
              <option value="1y">{t('dashboard.periods.lastYear')}</option>
            </select>
            
            <Link
              to="/create"
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>{t('dashboard.createNFT')}</span>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('dashboard.stats.totalNFTs')}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalNFTs}</p>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <Music className="h-6 w-6 text-primary-600" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('dashboard.stats.totalEarnings')}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalEarnings} FLOW</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('dashboard.stats.totalPlays')}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalPlays.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Play className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('dashboard.stats.totalLikes')}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalLikes}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <Heart className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Stats and Activity Stream */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <RealTimeStats />
          </div>
          <div>
            <ActivityStream />
          </div>
        </div>

        {/* My NFTs */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">{t('dashboard.myNFTs')}</h2>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Music className="h-4 w-4" />
              <span>{userNFTs.length} {t('dashboard.nftsCount')}</span>
            </div>
          </div>

          {userNFTs.length === 0 ? (
            <div className="text-center py-12">
              <Music className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t('dashboard.noNFTs')}</h3>
              <p className="text-gray-600 mb-4">{t('dashboard.noNFTsDesc')}</p>
              <Link
                to="/create"
                className="btn-primary inline-flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>{t('dashboard.createFirstNFT')}</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {userNFTs.map(nft => (
                <div key={nft.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center space-x-4">
                    {/* Cover Image */}
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-lg flex-shrink-0 overflow-hidden">
                      <div className="w-full h-full bg-gradient-to-br from-primary-500/20 to-secondary-500/20 flex items-center justify-center">
                        <Music className="h-8 w-8 text-primary-600/50" />
                      </div>
                    </div>

                    {/* NFT Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">{nft.title}</h3>
                          <p className="text-sm text-gray-600">{nft.artist}</p>
                          <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                            <span>{nft.genre}</span>
                            <span className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(nft.createdAt)}</span>
                            </span>
                            {nft.tokenId && (
                              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                Token #{nft.tokenId}
                              </span>
                            )}
                          </div>
                          {nft.transactionHash && (
                            <div className="mt-1 text-xs text-gray-500">
                              <span className="font-medium">Tx: </span>
                              <span className="font-mono">{nft.transactionHash.slice(0, 10)}...</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          {/* Status Badge */}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(nft.status)}`}>
                            {getStatusText(nft.status)}
                          </span>
                          
                          {/* Actions Menu */}
                          <div className="relative">
                            <button className="p-1 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                              <MoreVertical className="h-4 w-4 text-gray-400" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 text-sm text-gray-600">
                        <Play className="h-3 w-3" />
                        <span>{t('dashboard.nftStats.plays')}</span>
                      </div>
                      <div className="text-lg font-semibold text-gray-900">{nft.plays.toLocaleString()}</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 text-sm text-gray-600">
                        <Heart className="h-3 w-3" />
                        <span>{t('dashboard.nftStats.likes')}</span>
                      </div>
                      <div className="text-lg font-semibold text-gray-900">{nft.likes}</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 text-sm text-gray-600">
                        <DollarSign className="h-3 w-3" />
                        <span>{t('dashboard.nftStats.earnings')}</span>
                      </div>
                      <div className="text-lg font-semibold text-gray-900">{nft.earnings} FLOW</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 text-sm text-gray-600">
                        <TrendingUp className="h-3 w-3" />
                        <span>{t('dashboard.nftStats.price')}</span>
                      </div>
                      <div className="text-lg font-semibold text-gray-900">
                        {nft.price ? `${nft.price} FLOW` : t('dashboard.nftStats.notListed')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="mt-8 card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('dashboard.recentActivity')}</h2>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{t('dashboard.activity.saleCompleted')}</p>
                <p className="text-xs text-gray-600">{t('dashboard.activity.saleCompletedDesc', { title: 'Ethereal Waves', price: '7.2' })}</p>
              </div>
              <span className="text-xs text-gray-500">{t('dashboard.activity.timeAgo.hours', { count: 2 })}</span>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Music className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{t('dashboard.activity.nftCreated')}</p>
                <p className="text-xs text-gray-600">{t('dashboard.activity.nftCreatedDesc', { title: 'Cosmic Dreams' })}</p>
              </div>
              <span className="text-xs text-gray-500">{t('dashboard.activity.timeAgo.days', { count: 1 })}</span>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <Heart className="h-4 w-4 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{t('dashboard.activity.newLikes')}</p>
                <p className="text-xs text-gray-600">{t('dashboard.activity.newLikesDesc', { title: 'Urban Vibes', count: 15 })}</p>
              </div>
              <span className="text-xs text-gray-500">{t('dashboard.activity.timeAgo.days', { count: 2 })}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard