import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Save, X } from 'lucide-react'

const EditNFTForm = ({ nft, onSave, onCancel }) => {
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    title: nft.title || '',
    artist: nft.artist || '',
    description: nft.description || '',
    genre: nft.genre || '',
    price: nft.price || '',
    currency: nft.currency || 'FLOW',
    isForSale: nft.isForSale || false
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      await onSave(formData)
    } catch (error) {
      console.error('Failed to save NFT:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const genres = [
    'Electronic', 'Hip Hop', 'Rock', 'Pop', 'Jazz', 'Classical', 
    'R&B', 'Country', 'Folk', 'Reggae', 'Blues', 'Ambient', 'Other'
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          {t('create.form.title')}
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={t('create.form.titlePlaceholder')}
        />
      </div>

      {/* Artist */}
      <div>
        <label htmlFor="artist" className="block text-sm font-medium text-gray-700 mb-1">
          {t('create.form.artist')}
        </label>
        <input
          type="text"
          id="artist"
          name="artist"
          value={formData.artist}
          onChange={handleInputChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={t('create.form.artistPlaceholder')}
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          {t('create.form.description')}
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={t('create.form.descriptionPlaceholder')}
        />
      </div>

      {/* Genre */}
      <div>
        <label htmlFor="genre" className="block text-sm font-medium text-gray-700 mb-1">
          {t('create.form.genre')}
        </label>
        <select
          id="genre"
          name="genre"
          value={formData.genre}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">{t('create.form.selectGenre')}</option>
          {genres.map(genre => (
            <option key={genre} value={genre}>{genre}</option>
          ))}
        </select>
      </div>

      {/* Sale Settings */}
      <div className="border-t pt-4">
        <div className="flex items-center mb-3">
          <input
            type="checkbox"
            id="isForSale"
            name="isForSale"
            checked={formData.isForSale}
            onChange={handleInputChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="isForSale" className="ml-2 block text-sm text-gray-900">
            {t('create.form.listForSale')}
          </label>
        </div>

        {formData.isForSale && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                {t('create.form.price')}
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
                {t('create.form.currency')}
              </label>
              <select
                id="currency"
                name="currency"
                value={formData.currency}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="FLOW">FLOW</option>
                <option value="USDC">USDC</option>
                <option value="ETH">ETH</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {t('common.saving')}
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {t('common.save')}
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
        >
          <X className="w-4 h-4 mr-2" />
          {t('common.cancel')}
        </button>
      </div>
    </form>
  )
}

export default EditNFTForm