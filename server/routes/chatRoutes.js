import express from 'express'
import {
  fetchChats,
  createChat,
  createGroupChat,
  updateGroupChat,
  deleteGroupChat,
  deleteChat,
  updateGroupAvatar,
} from '../controllers/chatController.js'
import { upload } from '../middleware/uploadMiddleware.js'
import { protect } from '../middleware/authMiddleware.js'
import { groupCreationLimiter, uploadLimiter } from '../middleware/rateLimitMiddleware.js'

const router = express.Router()

router.route('/').get(protect, fetchChats).post(protect, createChat)
router.route('/group').post(protect, groupCreationLimiter, createGroupChat)
router.route('/group/:chatId').put(protect, updateGroupChat).delete(protect, deleteGroupChat)
router.delete('/:chatId', protect, deleteChat)
router.put('/group/:chatId/avatar', protect, uploadLimiter, upload.single('avatar'), updateGroupAvatar)

export default router
