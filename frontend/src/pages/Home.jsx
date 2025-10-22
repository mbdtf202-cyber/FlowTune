import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import { 
  Music, 
  Sparkles, 
  Coins, 
  Users, 
  ArrowRight, 
  Play,
  TrendingUp,
  Shield,
  Zap
} from 'lucide-react'

const Home = () => {
  const { isAuthenticated } = useAuth()
  const { t } = useTranslation()

  const features = [
    {
      icon: Sparkles,
      title: t('home.features.aiGeneration'),
      description: 'Create unique music tracks using advanced AI models with simple text prompts.',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Coins,
      title: t('home.features.nftMinting'),
      description: 'Mint, buy, and sell music NFTs with automatic royalty distribution.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Shield,
      title: 'Flow Blockchain',
      description: 'Built on Flow for fast, secure, and eco-friendly transactions.',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: TrendingUp,
      title: t('home.features.analytics'),
      description: 'Automated royalty distribution based on plays and sales.',
      color: 'from-orange-500 to-red-500'
    }
  ]

  const stats = [
    { label: 'Music NFTs Created', value: '1,234', icon: Music },
    { label: 'Total Sales', value: '$45.6K', icon: Coins },
    { label: 'Active Artists', value: '567', icon: Users },
    { label: 'Plays This Month', value: '89.2K', icon: Play }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
              {t('home.title')}
              <span className="block text-gradient mt-2">{t('home.subtitle')}</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8 max-w-3xl mx-auto px-4">
              {t('home.description')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4">
              {isAuthenticated ? (
                <Link
                  to="/create"
                  className="btn-primary flex items-center justify-center space-x-2 text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto min-h-[48px]"
                >
                  <Sparkles className="h-5 w-5" />
                  <span>{t('home.getStarted')}</span>
                  <ArrowRight className="h-5 w-5" />
                </Link>
              ) : (
                <div className="btn-primary flex items-center justify-center space-x-2 text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 opacity-75 cursor-not-allowed w-full sm:w-auto min-h-[48px]">
                  <Sparkles className="h-5 w-5" />
                  <span>{t('common.connect')}</span>
                </div>
              )}
              
              <Link
                to="/marketplace"
                className="btn-outline flex items-center justify-center space-x-2 text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto min-h-[48px]"
              >
                <Music className="h-5 w-5" />
                <span>{t('home.learnMore')}</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <div key={index} className="text-center p-4 sm:p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg mb-3 sm:mb-4">
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">{stat.value}</div>
                  <div className="text-xs sm:text-sm text-gray-600 leading-tight">{stat.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Revolutionizing Music Creation
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-4">
              Combining the power of AI, blockchain technology, and creative expression 
              to build the future of music ownership and distribution.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div key={index} className="card group hover:shadow-xl transition-all duration-300 p-4 sm:p-6">
                  <div className={`inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${feature.color} rounded-lg mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How FlowTune Works
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 px-4">
              Three simple steps to create and monetize your AI-generated music
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12">
            <div className="text-center">
              <div className="relative mb-6 sm:mb-8">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto">
                  <Sparkles className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-7 h-7 sm:w-8 sm:h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </div>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">Generate Music</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed px-4">
                Use AI to create unique music tracks from text prompts or upload your own audio files.
              </p>
            </div>

            <div className="text-center">
              <div className="relative mb-6 sm:mb-8">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto">
                  <Zap className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </div>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">Mint as NFT</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed px-4">
                Mint your music as an NFT on Flow blockchain with metadata stored on IPFS.
              </p>
            </div>

            <div className="text-center">
              <div className="relative mb-6 sm:mb-8">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto">
                  <Coins className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-7 h-7 sm:w-8 sm:h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </div>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">Trade & Earn</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed px-4">
                List your NFTs on the marketplace and earn royalties from every sale and play.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-primary-600 to-secondary-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6 leading-tight">
            Ready to Create Your First Music NFT?
          </h2>
          <p className="text-lg sm:text-xl text-primary-100 mb-6 sm:mb-8 px-4">
            Join the revolution of AI-powered music creation and blockchain ownership.
          </p>
          
          {isAuthenticated ? (
            <Link
              to="/create"
              className="inline-flex items-center justify-center space-x-2 bg-white text-primary-600 px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold hover:bg-gray-50 transition-colors duration-200 min-h-[48px] w-full sm:w-auto max-w-sm mx-auto"
            >
              <Sparkles className="h-5 w-5" />
              <span>Start Creating Now</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          ) : (
            <div className="inline-flex items-center justify-center space-x-2 bg-white/20 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold cursor-not-allowed min-h-[48px] w-full sm:w-auto max-w-sm mx-auto">
              <Sparkles className="h-5 w-5" />
              <span>Connect Wallet to Get Started</span>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default Home