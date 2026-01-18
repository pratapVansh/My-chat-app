import express from 'express'
import {
  registerUser,
  loginUser,
  getCurrentUser,
  logoutUser,
  searchUsers,
  refreshToken,
  forgotPassword,
  resetPassword,
} from '../controllers/authController.js'
import { protect } from '../middleware/authMiddleware.js'
import { upload } from '../middleware/uploadMiddleware.js'
import { uploadAvatar } from '../controllers/authController.js'
import {
  authLimiter,
  passwordResetLimiter,
  uploadLimiter,
  searchLimiter,
} from '../middleware/rateLimitMiddleware.js'

const router = express.Router()

router.post('/register', authLimiter, registerUser)
router.post('/login', authLimiter, loginUser)
router.post('/refresh', refreshToken)
router.post('/logout', protect, logoutUser)
router.get('/me', protect, getCurrentUser)
router.get('/search', protect, searchLimiter, searchUsers)
router.post('/avatar', protect, uploadLimiter, upload.single('avatar'), uploadAvatar)
router.post('/forgot-password', passwordResetLimiter, forgotPassword)
router.post('/reset-password/:token', passwordResetLimiter, resetPassword)

export default router
