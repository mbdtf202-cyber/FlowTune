import React, { useState, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import apiService from '../services/api'
import { useNotification } from '../components/Notification'

import AudioPlayer from '../components/AudioPlayer'
import MusicGenerationForm from '../components/MusicGenerationForm'
import UploadProgress from '../components/UploadProgress'
import ForteActionsWorkflow from '../components/ForteActionsWorkflow'
import AuthErrorModal from '../components/AuthErrorModal'
import { 
  Sparkles, 
  Upload, 
  Music, 
  Image,
  Loader,
  Coins,
  Zap
} from 'lucide-react'

const Create = () => {
  const { isAuthenticated, networkError, login } = useAuth()
  const { t } = useTranslation()
  const { addNotification, NotificationContainer } = useNotification()
  
  // Auth error modal state
  const [showAuthError, setShowAuthError] = useState(false)
  
  // State management
  const [activeTab, setActiveTab] = useState('generate')
  const [generatedAudio, setGeneratedAudio] = useState(null)
  const [uploadedAudio, setUploadedAudio] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [nftMetadata, setNftMetadata] = useState({
    title: '',
    artist: '',
    description: '',
    genre: '',
    coverImage: null
  })
  
  // Refs
  const audioFileRef = useRef(null)
  const coverImageRef = useRef(null)

  // Event handlers
  const handleGenerateMusic = async (formData) => {
    setIsGenerating(true)
    try {
      const result = await apiService.generateMusic(formData.prompt, {
        title: formData.title,
        artist: formData.artist,
        genre: formData.genre,
        duration: formData.duration
      })
      
      console.log('Music generation result:', result)
      
      // Correctly get audio URL - API returns data structure as result.data.audioUrl
      const audioUrl = result.data?.audioUrl || result.audioUrl
      if (audioUrl) {
        setGeneratedAudio(audioUrl)
        setNftMetadata(prev => ({
          ...prev,
          title: formData.title || result.data?.title,
          artist: formData.artist || result.data?.artist,
          genre: formData.genre || result.data?.genre
        }))
        addNotification(t('create.notifications.musicGenerated'), 'success')
      } else {
        throw new Error('No audio URL returned from generation')
      }
    } catch (error) {
      console.error('Music generation failed:', error)
      addNotification(t('create.notifications.musicGenerationFailed'), 'error')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAudioUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      if (file.type.startsWith('audio/')) {
        const audioUrl = URL.createObjectURL(file)
        setUploadedAudio({ file, url: audioUrl })
        addNotification(t('create.notifications.audioUploaded'), 'success')
      } else {
        addNotification(t('create.notifications.invalidAudioFile'), 'error')
      }
    }
  }

  const handleCoverImageUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      if (file.type.startsWith('image/')) {
        setNftMetadata(prev => ({ ...prev, coverImage: file }))
        addNotification(t('create.notifications.coverImageUploaded'), 'success')
      } else {
        addNotification(t('create.notifications.invalidImageFile'), 'error')
      }
    }
  }

  const handleMintNFT = async () => {
    const audioFile = generatedAudio ? 
      await window.fetch(generatedAudio).then(r => r.blob()) : 
      uploadedAudio?.file

    if (!audioFile) {
      addNotification(t('create.notifications.noAudioFile'), 'error')
      return
    }

    if (!nftMetadata.title || !nftMetadata.artist) {
      addNotification(t('create.notifications.missingMetadata'), 'error')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Upload audio to IPFS
      setUploadProgress(25)
      const audioHash = await apiService.uploadToIPFS(audioFile, {
        type: 'audio',
        title: nftMetadata.title,
        artist: nftMetadata.artist
      })

      // Upload cover image to IPFS if provided
      let coverImageHash = null
      if (nftMetadata.coverImage) {
        setUploadProgress(50)
        coverImageHash = await apiService.uploadToIPFS(nftMetadata.coverImage, {
          type: 'image',
          title: `${nftMetadata.title} - Cover`
        })
      }

      // Mint NFT on blockchain
      setUploadProgress(75)
      const mintData = {
        title: nftMetadata.title,
        description: nftMetadata.description || '',
        artist: nftMetadata.artist,
        genre: nftMetadata.genre || '',
        audioHash: audioHash.ipfsHash || audioHash,
        coverImageHash: coverImageHash?.ipfsHash || coverImageHash,
        metadataHash: '', // Will be generated by backend
        royalties: [
          {
            recipient: user.flowWallet?.address || user.address,
            percentage: 10 // 10% royalty to creator
          }
        ]
      }

      setUploadProgress(90)
      const mintResult = await apiService.request('/nft/mint', {
        method: 'POST',
        body: JSON.stringify(mintData),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token || localStorage.getItem('token')}`
        }
      })

      if (!mintResult.success) {
        throw new Error(mintResult.message || 'NFT minting failed')
      }

      setUploadProgress(100)
      addNotification(t('create.notifications.nftMinted'), 'success')

      // Reset form
      setGeneratedAudio(null)
      setUploadedAudio(null)
      setNftMetadata({
        title: '',
        artist: '',
        description: '',
        genre: '',
        coverImage: null
      })
      setUploadProgress(0)

    } catch (error) {
      console.error('NFT minting failed:', error)
      addNotification(t('create.notifications.nftMintFailed'), 'error')
    } finally {
      setIsUploading(false)
    }
  }

  console.log('Create component rendering, isAuthenticated:', isAuthenticated)

  const handleConnectWallet = async () => {
    try {
      await login()
    } catch (error) {
      setShowAuthError(true)
    }
  }

  if (!isAuthenticated) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="text-center max-w-md mx-auto">
            <Music className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Connect Your Wallet</h2>
            <p className="text-sm sm:text-base text-gray-600 mb-6">Please connect your wallet to start creating music NFTs</p>
            
            <button
              onClick={handleConnectWallet}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium w-full sm:w-auto min-h-[48px]"
            >
              Connect Wallet
            </button>
            
            {networkError && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{networkError.message}</p>
                <button
                  onClick={() => setShowAuthError(true)}
                  className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
                >
                  View Details
                </button>
              </div>
            )}
          </div>
        </div>
        
        <AuthErrorModal 
          isOpen={showAuthError} 
          onClose={() => setShowAuthError(false)} 
        />
      </>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8 pb-20 lg:pb-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Create Music NFT</h1>
          <p className="text-sm sm:text-base text-gray-600 px-4">Generate AI music or upload your own tracks to mint as NFTs</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-4 sm:mb-6 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('generate')}
            className={`flex-1 py-2 sm:py-3 px-2 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-colors ${
              activeTab === 'generate'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 sm:mr-2" />
            <span className="hidden sm:inline">AI Generate</span>
            <span className="sm:hidden">AI</span>
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-2 sm:py-3 px-2 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-colors ${
              activeTab === 'upload'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Upload className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Upload Audio</span>
            <span className="sm:hidden">Upload</span>
          </button>
          <button
            onClick={() => setActiveTab('forte-actions')}
            className={`flex-1 py-2 sm:py-3 px-2 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-colors ${
              activeTab === 'forte-actions'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Zap className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Forte Actions</span>
            <span className="sm:hidden">Forte</span>
          </button>
        </div>

        {/* Main Content Area */}
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
          {activeTab === 'generate' && (
            <div className="space-y-4 sm:space-y-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
                Generate AI Music
              </h2>
              <MusicGenerationForm
                onGenerate={handleGenerateMusic}
                isGenerating={isGenerating}
              />
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="space-y-4 sm:space-y-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
                Upload Your Music
              </h2>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 sm:p-8 text-center">
                <Music className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm sm:text-base text-gray-600 mb-4 px-4">
                  Drag and drop your audio file here, or click to browse
                </p>
                <input
                  ref={audioFileRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioUpload}
                  className="hidden"
                />
                <button
                  onClick={() => audioFileRef.current?.click()}
                  className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto min-h-[48px]"
                >
                  Choose Audio File
                </button>
              </div>
            </div>
          )}

          {activeTab === 'forte-actions' && (
            <div className="space-y-4 sm:space-y-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
                Forte Actions Workflow
              </h2>
              <ForteActionsWorkflow />
            </div>
          )}

          {/* Audio Player */}
          {(generatedAudio || uploadedAudio) && (
            <div className="mt-6 sm:mt-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Preview</h3>
              <AudioPlayer
                src={generatedAudio || uploadedAudio?.url}
                title={nftMetadata.title || 'Untitled'}
                artist={nftMetadata.artist || 'Unknown Artist'}
              />
            </div>
          )}

          {/* NFT Metadata Form */}
          {(generatedAudio || uploadedAudio) && (
            <div className="mt-6 sm:mt-8 space-y-4 sm:space-y-6">
              <h3 className="text-base sm:text-lg font-medium text-gray-900">NFT Metadata</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="sm:col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={nftMetadata.title}
                    onChange={(e) => setNftMetadata(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                    placeholder="Enter track title"
                  />
                </div>

                <div className="sm:col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Artist *
                  </label>
                  <input
                    type="text"
                    value={nftMetadata.artist}
                    onChange={(e) => setNftMetadata(prev => ({ ...prev, artist: e.target.value }))}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                    placeholder="Enter artist name"
                  />
                </div>

                <div className="sm:col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Genre
                  </label>
                  <input
                    type="text"
                    value={nftMetadata.genre}
                    onChange={(e) => setNftMetadata(prev => ({ ...prev, genre: e.target.value }))}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                    placeholder="Enter genre"
                  />
                </div>

                <div className="sm:col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cover Image
                  </label>
                  <input
                    ref={coverImageRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCoverImageUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => coverImageRef.current?.click()}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center min-h-[48px]"
                  >
                    <Image className="w-4 h-4 mr-2" />
                    {nftMetadata.coverImage ? 'Change Image' : 'Upload Cover'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={nftMetadata.description}
                  onChange={(e) => setNftMetadata(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base resize-none"
                  placeholder="Describe your music NFT"
                />
              </div>

              {/* Mint NFT Button */}
              <div className="flex justify-center pt-4">
                <button
                  onClick={handleMintNFT}
                  disabled={isUploading || !nftMetadata.title || !nftMetadata.artist}
                  className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center w-full sm:w-auto min-h-[48px]"
                >
                  {isUploading ? (
                     <>
                       <Loader className="w-5 h-5 mr-2 animate-spin" />
                       <span>Minting NFT...</span>
                     </>
                   ) : (
                     <>
                       <Coins className="w-5 h-5 mr-2" />
                       <span>Mint as NFT</span>
                     </>
                   )}
                </button>
              </div>

              {/* Upload Progress */}
              {isUploading && (
                <div className="mt-4">
                  <UploadProgress progress={uploadProgress} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Notification Container */}
      <NotificationContainer />
    </div>
  )
}

export default Create