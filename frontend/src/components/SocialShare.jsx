import React, { useState } from 'react';
import { 
  Share2, 
  Twitter, 
  MessageSquare, 
  Link, 
  Copy, 
  Check,
  X,
  ExternalLink,
  Users,
  TrendingUp
} from 'lucide-react';

const SocialShare = ({ track, isOpen, onClose }) => {
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareResults, setShareResults] = useState({});

  const generateShareLink = async () => {
    try {
      const response = await window.fetch('/api/social/share/link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ trackId: track.id })
      });

      const result = await response.json();
      if (result.shareLink) {
        setShareLink(result.shareLink);
        return result.shareLink;
      }
    } catch (error) {
      console.error('Failed to generate share link:', error);
    }
    return null;
  };

  const copyToClipboard = async () => {
    let link = shareLink;
    if (!link) {
      link = await generateShareLink();
    }
    
    if (link) {
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareToTwitter = async () => {
    setSharing(true);
    try {
      const response = await window.fetch('/api/social/share/twitter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ trackData: track })
      });

      const result = await response.json();
      setShareResults(prev => ({ ...prev, twitter: result }));
      
      if (result.success && result.tweetUrl) {
        window.open(result.tweetUrl, '_blank');
      }
    } catch (error) {
      console.error('Twitter share error:', error);
      setShareResults(prev => ({ 
        ...prev, 
        twitter: { success: false, error: error.message } 
      }));
    }
    setSharing(false);
  };

  const shareToDiscord = async () => {
    setSharing(true);
    try {
      const response = await window.fetch('/api/social/share/discord', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          trackData: track,
          channelInfo: { channelId: 'general' }
        })
      });

      const result = await response.json();
      setShareResults(prev => ({ ...prev, discord: result }));
    } catch (error) {
      console.error('Discord share error:', error);
      setShareResults(prev => ({ 
        ...prev, 
        discord: { success: false, error: error.message } 
      }));
    }
    setSharing(false);
  };

  const bulkShare = async () => {
    setSharing(true);
    try {
      const response = await window.fetch('/api/social/share/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          trackData: track,
          platforms: ['twitter', 'discord'],
          channelInfo: { channelId: 'general' }
        })
      });

      const result = await response.json();
      if (result.results) {
        const resultsMap = {};
        result.results.forEach(r => {
          resultsMap[r?.platform] = r;
        });
        setShareResults(resultsMap);
      }
    } catch (error) {
      console.error('Bulk share error:', error);
    }
    setSharing(false);
  };

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Share2 className="h-5 w-5 mr-2" />
            Share Track
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Track Info */}
        <div className="p-6 border-b">
          <div className="flex items-center space-x-4">
            <img
              src={track.coverImage || '/images/default-track-cover.svg'}
              alt={track.title}
              className="w-16 h-16 rounded-lg object-cover"
            />
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">{track.title}</h4>
              <p className="text-sm text-gray-600">{track.genre}</p>
              <p className="text-xs text-gray-500">{formatDuration(track.duration)}</p>
            </div>
          </div>
        </div>

        {/* Share Options */}
        <div className="p-6 space-y-4">
          {/* Quick Share Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={shareToTwitter}
              disabled={sharing}
              className="flex items-center justify-center space-x-2 bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              <Twitter className="h-4 w-4" />
              <span>Twitter</span>
              {shareResults.twitter?.success && (
                <Check className="h-4 w-4 text-green-200" />
              )}
            </button>
            
            <button
              onClick={shareToDiscord}
              disabled={sharing}
              className="flex items-center justify-center space-x-2 bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Discord</span>
              {shareResults.discord?.success && (
                <Check className="h-4 w-4 text-green-200" />
              )}
            </button>
          </div>

          {/* Bulk Share */}
          <button
            onClick={bulkShare}
            disabled={sharing}
            className="w-full flex items-center justify-center space-x-2 bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            <Users className="h-4 w-4" />
            <span>Share to All Platforms</span>
          </button>

          {/* Copy Link */}
          <div className="flex space-x-2">
            <input
              type="text"
              value={shareLink}
              placeholder="Click to generate share link..."
              readOnly
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
            />
            <button
              onClick={copyToClipboard}
              className="flex items-center space-x-1 bg-gray-500 text-white px-3 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Share Results */}
          {Object.keys(shareResults).length > 0 && (
            <div className="space-y-2">
              <h5 className="text-sm font-medium text-gray-700">Share Results:</h5>
              {Object.entries(shareResults).map(([platform, result]) => (
                <div
                  key={platform}
                  className={`flex items-center justify-between p-2 rounded text-sm ${
                    result.success 
                      ? 'bg-green-50 text-green-700' 
                      : 'bg-red-50 text-red-700'
                  }`}
                >
                  <span className="capitalize">{platform}</span>
                  <span className="flex items-center">
                    {result.success ? (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Success
                        {result.tweetUrl && (
                          <ExternalLink 
                            className="h-3 w-3 ml-1 cursor-pointer" 
                            onClick={() => window.open(result.tweetUrl, '_blank')}
                          />
                        )}
                      </>
                    ) : (
                      <>
                        <X className="h-4 w-4 mr-1" />
                        Failed
                      </>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Share Tips */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-start space-x-2">
              <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-medium">Pro Tip:</p>
                <p>Sharing your tracks helps increase visibility and engagement. Use relevant hashtags for better reach!</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-lg">
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>Share analytics available in your dashboard</span>
            <button
              onClick={onClose}
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialShare;