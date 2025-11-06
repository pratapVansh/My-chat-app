import express from 'express'
import {
  sendMessage,
  fetchMessages,
  editMessage,
  deleteMessage,
  deleteAllMessagesInChat,
  markMessagesAsRead,
  getUnreadCount,
  getUnreadCounts
} from '../controllers/messageController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.route('/').post(protect, sendMessage)
router.route('/unread-counts').get(protect, getUnreadCounts)
router.route('/:chatId').get(protect, fetchMessages)
router.route('/mark-read/:chatId').put(protect, markMessagesAsRead)
router.route('/unread/:chatId').get(protect, getUnreadCount)
router.route('/:messageId/edit').put(protect, editMessage)
router.route('/:messageId').delete(protect, deleteMessage)
router.delete('/chat/:chatId', protect, deleteAllMessagesInChat)

export default router
