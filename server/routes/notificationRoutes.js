import express from 'express'
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadNotificationCount
} from '../controllers/notificationController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.route('/').get(protect, getNotifications)
router.route('/unread-count').get(protect, getUnreadNotificationCount)
router.route('/mark-all-read').put(protect, markAllNotificationsAsRead)
router.route('/:notificationId/read').put(protect, markNotificationAsRead)
router.route('/:notificationId').delete(protect, deleteNotification)

export default router