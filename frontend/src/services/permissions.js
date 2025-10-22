/**
 * Permission management service
 * Handles user roles and permission verification
 */

import logger from './logger.jsx'

// User role definitions
export const USER_ROLES = {
  ADMIN: 'admin',
  CREATOR: 'creator',
  COLLECTOR: 'collector',
  USER: 'user'
}

// Permission definitions
export const PERMISSIONS = {
  // NFT related permissions
  CREATE_NFT: 'create_nft',
  EDIT_NFT: 'edit_nft',
  DELETE_NFT: 'delete_nft',
  LIST_NFT: 'list_nft',
  BUY_NFT: 'buy_nft',
  
  // User management permissions
  MANAGE_USERS: 'manage_users',
  VIEW_USER_DETAILS: 'view_user_details',
  
  // System management permissions
  MANAGE_SYSTEM: 'manage_system',
  VIEW_ANALYTICS: 'view_analytics',
  
  // Content management permissions
  MODERATE_CONTENT: 'moderate_content',
  MANAGE_MARKETPLACE: 'manage_marketplace'
}

// Role permission mapping
const ROLE_PERMISSIONS = {
  [USER_ROLES.ADMIN]: [
    PERMISSIONS.CREATE_NFT,
    PERMISSIONS.EDIT_NFT,
    PERMISSIONS.DELETE_NFT,
    PERMISSIONS.LIST_NFT,
    PERMISSIONS.BUY_NFT,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_USER_DETAILS,
    PERMISSIONS.MANAGE_SYSTEM,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.MODERATE_CONTENT,
    PERMISSIONS.MANAGE_MARKETPLACE
  ],
  [USER_ROLES.CREATOR]: [
    PERMISSIONS.CREATE_NFT,
    PERMISSIONS.EDIT_NFT,
    PERMISSIONS.DELETE_NFT,
    PERMISSIONS.LIST_NFT,
    PERMISSIONS.BUY_NFT,
    PERMISSIONS.VIEW_ANALYTICS
  ],
  [USER_ROLES.COLLECTOR]: [
    PERMISSIONS.BUY_NFT,
    PERMISSIONS.LIST_NFT
  ],
  [USER_ROLES.USER]: [
    PERMISSIONS.BUY_NFT
  ]
}

class PermissionService {
  constructor() {
    this.userRole = USER_ROLES.USER
    this.customPermissions = new Set()
  }

  /**
   * Set user role
   * @param {string} role - User role
   */
  setUserRole(role) {
    if (!Object.values(USER_ROLES).includes(role)) {
      logger.warn('Invalid role:', role);
      return false;
    }
    
    this.currentRole = role;
    this.customPermissions.clear();
    logger.info('User role set:', role);
    return true;
  }

  /**
   * Get user role
   * @returns {string} User role
   */
  getUserRole() {
    return this.currentRole;
  }

  /**
   * Add custom permission
   * @param {string} permission - Permission name
   */
  addCustomPermission(permission) {
    this.customPermissions.add(permission);
    logger.info('Custom permission added:', permission);
  }

  /**
   * Remove custom permission
   * @param {string} permission - Permission name
   */
  removeCustomPermission(permission) {
    this.customPermissions.delete(permission);
    logger.info('Custom permission removed:', permission);
  }

  /**
   * Check if user has specified permission
   * @param {string} permission - Permission name
   * @returns {boolean} Whether user has permission
   */
  hasPermission(permission) {
    // Check role permissions
    const rolePermissions = ROLE_PERMISSIONS[this.currentRole] || [];
    if (rolePermissions.includes(permission)) {
      return true;
    }
    
    // Check custom permissions
    return this.customPermissions.has(permission);
  }

  /**
   * Check if user has any of the permissions
   * @param {string[]} permissions - Permission list
   * @returns {boolean} Whether user has any permission
   */
  hasAnyPermission(permissions) {
    return permissions.some(permission => this.hasPermission(permission))
  }

  /**
   * Check if user has all permissions
   * @param {string[]} permissions - Permission list
   * @returns {boolean} Whether user has all permissions
   */
  hasAllPermissions(permissions) {
    return permissions.every(permission => this.hasPermission(permission))
  }

  /**
   * Get all user permissions
   * @returns {string[]} Permission list
   */
  getUserPermissions() {
    const rolePermissions = ROLE_PERMISSIONS[this.userRole] || []
    const customPermissions = Array.from(this.customPermissions)
    return [...new Set([...rolePermissions, ...customPermissions])]
  }

  /**
   * Check if user is admin
   * @returns {boolean} Whether user is admin
   */
  isAdmin() {
    return this.userRole === USER_ROLES.ADMIN
  }

  /**
   * Check if user is creator
   * @returns {boolean} Whether user is creator
   */
  isCreator() {
    return this.userRole === USER_ROLES.CREATOR || this.isAdmin()
  }

  /**
   * Check if user is collector
   * @returns {boolean} Whether user is collector
   */
  isCollector() {
    return this.userRole === USER_ROLES.COLLECTOR || this.isCreator()
  }

  /**
   * Reset permissions
   */
  reset() {
    this.userRole = USER_ROLES.USER
    this.customPermissions.clear()
    logger.info('Permissions reset')
  }

  /**
   * Initialize permissions from user data
   * @param {Object} userData - User data
   */
  initializeFromUser(userData) {
    if (userData) {
      this.setUserRole(userData.role || USER_ROLES.USER)
      
      // Set custom permissions
      if (userData.customPermissions && Array.isArray(userData.customPermissions)) {
        userData.customPermissions.forEach(permission => {
          this.addCustomPermission(permission)
        })
      }
      
      logger.info('Permissions initialized from user data', { 
        role: this.userRole,
        customPermissions: userData.customPermissions 
      })
    }
  }
}

// Create global permission service instance
const permissionService = new PermissionService()

// Permission check decorator
export const requirePermission = (permission) => {
  return (target, propertyKey, descriptor) => {
    const originalMethod = descriptor.value
    
    descriptor.value = function(...args) {
      if (!permissionService.hasPermission(permission)) {
        const error = new Error(`Permission denied: ${permission}`)
        logger.warn('Permission denied', { permission, method: propertyKey })
        throw error
      }
      
      return originalMethod.apply(this, args)
    }
    
    return descriptor
  }
}

// Role check decorator
export const requireRole = (role) => {
  return (target, propertyKey, descriptor) => {
    const originalMethod = descriptor.value
    
    descriptor.value = function(...args) {
      if (permissionService.getUserRole() !== role && !permissionService.isAdmin()) {
        const error = new Error(`Role required: ${role}`)
        logger.warn('Role check failed', { requiredRole: role, userRole: permissionService.getUserRole() })
        throw error
      }
      
      return originalMethod.apply(this, args)
    }
    
    return descriptor
  }
}

export default permissionService