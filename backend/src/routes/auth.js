/**
 * Authentication Routes
 * Handles user authentication endpoints
 */

import express from 'express';
import { body } from 'express-validator';
import authController from '../controllers/authController.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import { rateLimiter } from '../middleware/rateLimiter.js';
import securityMiddleware from '../middleware/security.js';

const router = express.Router();

// Validation rules
const registerValidation = [
  body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores, and hyphens'),
  
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('flowAddress')
    .matches(/^0x[a-fA-F0-9]{16}$/)
    .withMessage('Please provide a valid Flow address')
];

const loginValidation = [
  body('identifier')
    .notEmpty()
    .withMessage('Email or username is required'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const flowWalletAuthValidation = [
  body('flowAddress')
    .matches(/^0x[a-fA-F0-9]{16}$/)
    .withMessage('Please provide a valid Flow address'),
  
  body('signature')
    .optional()
    .isString()
    .withMessage('Signature must be a string'),
  
  body('message')
    .optional()
    .isString()
    .withMessage('Message must be a string')
];

const updateProfileValidation = [
  body('profile.displayName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Display name must be between 1 and 50 characters'),
  
  body('profile.bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio must be less than 500 characters'),
  
  body('profile.website')
    .optional()
    .isURL()
    .withMessage('Please provide a valid website URL'),
  
  body('profile.twitter')
    .optional()
    .matches(/^@?[a-zA-Z0-9_]{1,15}$/)
    .withMessage('Please provide a valid Twitter handle'),
  
  body('profile.instagram')
    .optional()
    .matches(/^@?[a-zA-Z0-9_.]{1,30}$/)
    .withMessage('Please provide a valid Instagram handle'),
  
  body('preferences.emailNotifications')
    .optional()
    .isBoolean()
    .withMessage('Email notifications preference must be a boolean'),
  
  body('preferences.pushNotifications')
    .optional()
    .isBoolean()
    .withMessage('Push notifications preference must be a boolean')
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number')
];

// Apply rate limiting to auth routes
router.use(rateLimiter);

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', 
  securityMiddleware.rateLimiters.auth,
  registerValidation, 
  authController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user with email/username and password
 * @access  Public
 */
router.post('/login', 
  securityMiddleware.rateLimiters.auth,
  loginValidation, 
  authController.login
);

/**
 * @route   POST /api/auth/wallet
 * @desc    Login/Register with Flow wallet
 * @access  Public
 */
router.post('/wallet', flowWalletAuthValidation, authController.flowWalletAuth);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', authenticateToken, authController.getProfile);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', authenticateToken, updateProfileValidation, authController.updateProfile);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post('/change-password', authenticateToken, changePasswordValidation, authController.changePassword);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticateToken, authController.logout);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh JWT token
 * @access  Private
 */
router.post('/refresh', authenticateToken, authController.refreshToken);

/**
 * @route   GET /api/auth/verify
 * @desc    Verify token validity
 * @access  Private
 */
router.get('/verify', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Token is valid',
    data: {
      user: req.user
    }
  });
});

export default router;