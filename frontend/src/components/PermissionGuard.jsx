/**
 * Permission Guard Component
 * Controls component display and access based on user permissions
 */

import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import permissionService from '../services/permissions'
import logger from '../services/logger.jsx'

/**
 * Permission Guard Component
 * @param {Object} props - Component properties
 * @param {string|string[]} props.permission - Required permission
 * @param {string} props.role - Required role
 * @param {boolean} props.requireAll - Whether all permissions are required (when permission is an array)
 * @param {React.ReactNode} props.children - Child components
 * @param {React.ReactNode} props.fallback - Content to display when no permission
 * @param {boolean} props.hideOnNoPermission - Whether to hide when no permission (don't show fallback)
 */
const PermissionGuard = ({
  permission,
  role,
  requireAll = false,
  children,
  fallback = null,
  hideOnNoPermission = false
}) => {
  const { user } = useAuth()

  // If user is not logged in, show fallback or hide
  if (!user) {
    if (hideOnNoPermission) {
      return null
    }
    return fallback || (
      <div className="text-center py-8">
        <p className="text-gray-500">Please log in to access this feature</p>
      </div>
    )
  }

  // Check role permission
  if (role && permissionService.getUserRole() !== role && !permissionService.isAdmin()) {
    logger.warn('Role access denied', { requiredRole: role, userRole: permissionService.getUserRole() })
    
    if (hideOnNoPermission) {
      return null
    }
    
    return fallback || (
      <div className="text-center py-8">
        <p className="text-gray-500">You don't have permission to access this feature</p>
      </div>
    )
  }

  // Check specific permission
  if (permission) {
    let hasPermission = false

    if (Array.isArray(permission)) {
      hasPermission = requireAll 
        ? permissionService.hasAllPermissions(permission)
        : permissionService.hasAnyPermission(permission)
    } else {
      hasPermission = permissionService.hasPermission(permission)
    }

    if (!hasPermission) {
      logger.warn('Permission access denied', { 
        requiredPermission: permission, 
        userPermissions: permissionService.getUserPermissions() 
      })
      
      if (hideOnNoPermission) {
        return null
      }
      
      return fallback || (
        <div className="text-center py-8">
          <p className="text-gray-500">You don't have permission to perform this action</p>
        </div>
      )
    }
  }

  // Has permission, show child components
  return children
}

/**
 * Admin Guard Component
 */
export const AdminGuard = ({ children, fallback, hideOnNoPermission = false }) => {
  return (
    <PermissionGuard
      role="admin"
      fallback={fallback}
      hideOnNoPermission={hideOnNoPermission}
    >
      {children}
    </PermissionGuard>
  )
}

/**
 * Creator Guard Component
 */
export const CreatorGuard = ({ children, fallback, hideOnNoPermission = false }) => {
  const { user } = useAuth()
  
  if (!user) {
    if (hideOnNoPermission) return null
    return fallback || <div className="text-center py-8"><p className="text-gray-500">Please log in first</p></div>
  }

  const isCreator = permissionService.isCreator()
  
  if (!isCreator) {
    if (hideOnNoPermission) return null
    return fallback || (
      <div className="text-center py-8">
        <p className="text-gray-500">This feature is only available to creators</p>
      </div>
    )
  }

  return children
}

/**
 * NFT Owner Guard Component
 */
export const NFTOwnerGuard = ({ nft, children, fallback, hideOnNoPermission = false }) => {
  const { user } = useAuth()
  
  if (!user || !nft) {
    if (hideOnNoPermission) return null
    return fallback || <div className="text-center py-8"><p className="text-gray-500">Unable to verify ownership</p></div>
  }

  const isOwner = nft.owner === user.address || nft.creator === user.address
  const isAdmin = permissionService.isAdmin()
  
  if (!isOwner && !isAdmin) {
    if (hideOnNoPermission) return null
    return fallback || (
      <div className="text-center py-8">
        <p className="text-gray-500">You are not the owner of this NFT</p>
      </div>
    )
  }

  return children
}

/**
 * Permission Button Component
 * Controls button display and click based on permissions
 */
export const PermissionButton = ({
  permission,
  role,
  onClick,
  disabled = false,
  className = '',
  children,
  ...props
}) => {
  const { user } = useAuth()
  
  // 检查权限
  let hasPermission = true
  
  if (!user) {
    hasPermission = false
  } else if (role && permissionService.getUserRole() !== role && !permissionService.isAdmin()) {
    hasPermission = false
  } else if (permission && !permissionService.hasPermission(permission)) {
    hasPermission = false
  }

  const handleClick = (e) => {
    if (!hasPermission) {
      e.preventDefault()
      logger.warn('Button click blocked due to insufficient permissions', { permission, role })
      return
    }
    
    if (onClick) {
      onClick(e)
    }
  }

  return (
    <button
      {...props}
      onClick={handleClick}
      disabled={disabled || !hasPermission}
      className={`${className} ${!hasPermission ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  )
}

/**
 * Permission Link Component
 */
export const PermissionLink = ({
  permission,
  role,
  to,
  onClick,
  className = '',
  children,
  ...props
}) => {
  const { user } = useAuth()
  
  // 检查权限
  let hasPermission = true
  
  if (!user) {
    hasPermission = false
  } else if (role && permissionService.getUserRole() !== role && !permissionService.isAdmin()) {
    hasPermission = false
  } else if (permission && !permissionService.hasPermission(permission)) {
    hasPermission = false
  }

  const handleClick = (e) => {
    if (!hasPermission) {
      e.preventDefault()
      logger.warn('Link click blocked due to insufficient permissions', { permission, role })
      return
    }
    
    if (onClick) {
      onClick(e)
    }
  }

  if (!hasPermission) {
    return (
      <span className={`${className} opacity-50 cursor-not-allowed`}>
        {children}
      </span>
    )
  }

  return (
    <a
      {...props}
      href={to}
      onClick={handleClick}
      className={className}
    >
      {children}
    </a>
  )
}

export default PermissionGuard