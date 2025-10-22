import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  X, 
  Copy, 
  Twitter, 
  Facebook, 
  MessageCircle,
  Mail,
  QrCode,
  Check
} from 'lucide-react'

const ShareModal = ({ isOpen, onClose, nft }) => {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  const [showQR, setShowQR] = useState(false)

  if (!isOpen || !nft) return null

  const shareUrl = `${window.location.origin}/music-library/${nft.id}`
  const shareText = `Check out this amazing AI-generated music NFT: "${nft.title}" by ${nft.artist} on FlowTune!`

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy link:', error)
    }
  }

  const handleTwitterShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}&hashtags=FlowTune,MusicNFT,AI`
    window.open(twitterUrl, '_blank', 'width=600,height=400')
  }

  const handleFacebookShare = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`
    window.open(facebookUrl, '_blank', 'width=600,height=400')
  }

  const handleWhatsAppShare = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`
    window.open(whatsappUrl, '_blank')
  }

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Check out "${nft.title}" on FlowTune`)
    const body = encodeURIComponent(`${shareText}\n\n${shareUrl}`)
    const emailUrl = `mailto:?subject=${subject}&body=${body}`
    window.open(emailUrl)
  }

  const generateQRCode = () => {
    // Simple QR code generation using a free service
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {t('musicLibrary.shareNFT')}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* NFT Preview */}
          <div className="flex items-center mb-6 p-3 bg-gray-50 rounded-lg">
            <img
              src={nft.coverImage}
              alt={nft.title}
              className="w-12 h-12 rounded-lg object-cover"
            />
            <div className="ml-3">
              <h4 className="font-medium text-gray-900">{nft.title}</h4>
              <p className="text-sm text-gray-600">{nft.artist}</p>
            </div>
          </div>

          {/* Share Options */}
          <div className="space-y-3">
            {/* Copy Link */}
            <button
              onClick={handleCopyLink}
              className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                {copied ? (
                  <Check className="w-5 h-5 text-green-600 mr-3" />
                ) : (
                  <Copy className="w-5 h-5 text-gray-600 mr-3" />
                )}
                <span className="text-gray-900">
                  {copied ? t('common.copied') : t('common.copyLink')}
                </span>
              </div>
            </button>

            {/* Social Media Shares */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleTwitterShare}
                className="flex items-center justify-center p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors"
              >
                <Twitter className="w-5 h-5 text-blue-500 mr-2" />
                <span className="text-gray-900">Twitter</span>
              </button>

              <button
                onClick={handleFacebookShare}
                className="flex items-center justify-center p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors"
              >
                <Facebook className="w-5 h-5 text-blue-600 mr-2" />
                <span className="text-gray-900">Facebook</span>
              </button>

              <button
                onClick={handleWhatsAppShare}
                className="flex items-center justify-center p-3 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-200 transition-colors"
              >
                <MessageCircle className="w-5 h-5 text-green-600 mr-2" />
                <span className="text-gray-900">WhatsApp</span>
              </button>

              <button
                onClick={handleEmailShare}
                className="flex items-center justify-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
              >
                <Mail className="w-5 h-5 text-gray-600 mr-2" />
                <span className="text-gray-900">Email</span>
              </button>
            </div>

            {/* QR Code */}
            <button
              onClick={() => setShowQR(!showQR)}
              className="w-full flex items-center justify-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <QrCode className="w-5 h-5 text-gray-600 mr-2" />
              <span className="text-gray-900">
                {showQR ? t('common.hideQR') : t('common.showQR')}
              </span>
            </button>

            {showQR && (
              <div className="flex justify-center p-4 bg-gray-50 rounded-lg">
                <img
                  src={generateQRCode()}
                  alt="QR Code"
                  className="w-48 h-48"
                />
              </div>
            )}
          </div>

          {/* Share URL */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">{t('common.shareUrl')}</p>
            <p className="text-sm text-gray-700 break-all">{shareUrl}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ShareModal