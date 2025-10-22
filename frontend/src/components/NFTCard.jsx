import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Heart, Clock, User } from 'lucide-react';

export const NFTCard = ({ 
  nft, 
  onPlay, 
  onBuy, 
  onFavorite, 
  loading = false,
  showOwner = false,
  showDate = false
}) => {
  const [isFavorited, setIsFavorited] = useState(false);
  const [imageError, setImageError] = useState(false);

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleFavoriteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorited(!isFavorited);
    onFavorite?.(nft.id);
  };

  const handlePlayClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onPlay?.(nft);
  };

  const handleBuyClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onBuy?.(nft);
  };

  if (loading) {
    return (
      <div className="nft-card-skeleton" data-testid="nft-card-skeleton">
        <div className="animate-pulse">
          <div className="bg-gray-300 h-48 rounded-lg mb-4"></div>
          <div className="bg-gray-300 h-4 rounded mb-2"></div>
          <div className="bg-gray-300 h-3 rounded mb-2"></div>
          <div className="bg-gray-300 h-4 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <Link 
      to={`/nft/${nft.id}`} 
      className="nft-card block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
      data-testid="nft-card-link"
    >
      <div className="nft-card-content" data-testid="nft-card">
        {/* Image Section */}
        <div className="relative">
          {imageError || !nft.image ? (
            <div 
              className="h-48 bg-gray-200 rounded-t-lg flex items-center justify-center"
              data-testid="image-placeholder"
            >
              <span className="text-gray-500">No Image</span>
            </div>
          ) : (
            <img
              src={nft.image}
              alt={nft.title}
              className="w-full h-48 object-cover rounded-t-lg"
              onError={() => setImageError(true)}
            />
          )}
          
          {/* Overlay Controls */}
          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-300 rounded-t-lg flex items-center justify-center">
            <button
              onClick={handlePlayClick}
              className="opacity-0 hover:opacity-100 transition-opacity duration-300 bg-white rounded-full p-3 shadow-lg"
              data-testid="preview-play-button"
              aria-label="Preview audio"
            >
              <Play className="w-6 h-6 text-gray-800" />
            </button>
          </div>

          {/* Favorite Button */}
          <button
            onClick={handleFavoriteClick}
            className="absolute top-2 right-2 p-2 bg-white bg-opacity-80 rounded-full hover:bg-opacity-100 transition-all"
            data-testid="favorite-button"
          >
            <Heart 
              className={`w-5 h-5 ${isFavorited ? 'text-red-500 fill-current' : 'text-gray-600'}`} 
            />
          </button>

          {/* Genre Badge */}
          <div 
            className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded text-xs"
            data-testid="genre-badge"
          >
            {nft.genre}
          </div>
        </div>

        {/* Content Section */}
        <div className="p-4">
          {/* Title and Artist */}
          <h3 
            className="font-semibold text-lg mb-1 truncate"
            data-testid="nft-title"
          >
            {nft.title}
          </h3>
          <p className="text-gray-600 text-sm mb-2">{nft.artist}</p>

          {/* Duration */}
          <div className="flex items-center text-gray-500 text-sm mb-3">
            <Clock className="w-4 h-4 mr-1" />
            <span>{formatDuration(nft.duration)}</span>
          </div>

          {/* Owner Info */}
          {showOwner && (
            <div className="flex items-center text-gray-500 text-sm mb-2">
              <User className="w-4 h-4 mr-1" />
              <span>Owner: {formatAddress(nft.owner)}</span>
            </div>
          )}

          {/* Creation Date */}
          {showDate && (
            <div className="text-gray-500 text-sm mb-2">
              Created: {formatDate(nft.createdAt)}
            </div>
          )}

          {/* Price and Buy Button */}
          <div className="flex items-center justify-between">
            <div className="text-lg font-bold text-blue-600">
              {nft.price} {nft.currency}
            </div>
            
            {nft.isForSale ? (
              <button
                onClick={handleBuyClick}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
                data-testid="buy-button"
              >
                Buy Now
              </button>
            ) : (
              <span className="text-gray-500 text-sm">Not for sale</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};