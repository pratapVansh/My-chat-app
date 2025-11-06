import asyncHandler from '../utils/asyncHandler.js'
import ApiResponse from '../utils/ApiResponse.js'
import ApiError from '../utils/ApiError.js'
import Notification from '../models/Notification.js'

// @desc    Get all notifications for current user
// @route   GET /api/notification
// @access  Private
export const getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, unreadOnly = false } = req.query
  
  const query = { recipient: req.user._id }
  if (unreadOnly === 'true') {
    query.isRead = false
  }

  const notifications = await Notification.find(query)
    .populate('sender', 'name avatar')
    .populate('data.chatId', 'chatName isGroupChat')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)

  const totalNotifications = await Notification.countDocuments(query)

  res.json(
    new ApiResponse(
      true,
      'Notifications fetched successfully',
      {
        notifications,
        totalPages: Math.ceil(totalNotifications / limit),
        currentPage: page,
        totalNotifications
      }
    )
  )
})

// @desc    Mark notification as read
// @route   PUT /api/notification/:notificationId/read
// @access  Private
export const markNotificationAsRead = asyncHandler(async (req, res) => {
  const { notificationId } = req.params

  const notification = await Notification.findById(notificationId)
  if (!notification) {
    throw new ApiError('Notification not found', 404)
  }

  if (notification.recipient.toString() !== req.user._id.toString()) {
    throw new ApiError('Unauthorized to mark this notification as read', 403)
  }

  notification.isRead = true
  notification.readAt = new Date()
  await notification.save()

  res.json(
    new ApiResponse(
      true,
      'Notification marked as read',
      notification
    )
  )
})

// @desc    Mark all notifications as read
// @route   PUT /api/notification/mark-all-read
// @access  Private
export const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
  const result = await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { 
      isRead: true, 
      readAt: new Date() 
    }
  )

  res.json(
    new ApiResponse(
      true,
      'All notifications marked as read',
      { modifiedCount: result.modifiedCount }
    )
  )
})

// @desc    Delete notification
// @route   DELETE /api/notification/:notificationId
// @access  Private
export const deleteNotification = asyncHandler(async (req, res) => {
  const { notificationId } = req.params

  const notification = await Notification.findById(notificationId)
  if (!notification) {
    throw new ApiError('Notification not found', 404)
  }

  if (notification.recipient.toString() !== req.user._id.toString()) {
    throw new ApiError('Unauthorized to delete this notification', 403)
  }

  await notification.deleteOne()

  res.json(
    new ApiResponse(
      true,
      'Notification deleted successfully',
      null
    )
  )
})

// @desc    Get unread notification count
// @route   GET /api/notification/unread-count
// @access  Private
export const getUnreadNotificationCount = asyncHandler(async (req, res) => {
  const unreadCount = await Notification.countDocuments({
    recipient: req.user._id,
    isRead: false
  })

  res.json(
    new ApiResponse(
      true,
      'Unread notification count fetched',
      { unreadCount }
    )
  )
})

// @desc    Create notification (helper function, not an endpoint)
export const createNotification = async ({
  recipient,
  sender,
  type,
  title,
  message,
  data = {}
}) => {
  try {
    const notification = await Notification.create({
      recipient,
      sender,
      type,
      title,
      message,
      data
    })

    return await notification.populate('sender', 'name avatar')
  } catch (error) {
    console.error('Error creating notification:', error)
    throw error
  }
}