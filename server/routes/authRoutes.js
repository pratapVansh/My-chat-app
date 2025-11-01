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

const router = express.Router()

router.post('/register', registerUser)
router.post('/login', loginUser)
router.post('/refresh', refreshToken)
router.post('/logout', protect, logoutUser)
router.get('/me', protect, getCurrentUser)
router.get('/search', protect, searchUsers)
router.post('/avatar', protect, upload.single('avatar'), uploadAvatar)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password/:token', resetPassword)

export default router
