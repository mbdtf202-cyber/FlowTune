import React from 'react'
import { CheckCircle, AlertCircle, Loader2, Upload } from 'lucide-react'

const UploadProgress = ({ status, progress, error, onRetry }) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'uploading':
        return <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      case 'success':
        return <CheckCircle className="h-6 w-6 text-green-600" />
      case 'error':
        return <AlertCircle className="h-6 w-6 text-red-600" />
      default:
        return <Upload className="h-6 w-6 text-gray-400" />
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'uploading':
        return 'Uploading to blockchain...'
      case 'success':
        return 'Successfully uploaded!'
      case 'error':
        return error || 'Upload failed'
      default:
        return 'Ready to upload'
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'uploading':
        return 'text-blue-600'
      case 'success':
        return 'text-green-600'
      case 'error':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getBgColor = () => {
    switch (status) {
      case 'uploading':
        return 'bg-blue-50 border-blue-200'
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  return (
    <div className={`border rounded-lg p-4 ${getBgColor()}`}>
      <div className="flex items-center space-x-3">
        {getStatusIcon()}
        <div className="flex-1">
          <p className={`font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </p>
          {status === 'uploading' && (
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-1">{progress}% complete</p>
            </div>
          )}
          {status === 'error' && onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default UploadProgress