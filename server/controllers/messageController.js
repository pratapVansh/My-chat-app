import asyncHandler from '../utils/asyncHandler.js'
import ApiResponse from '../utils/ApiResponse.js'
import ApiError from '../utils/ApiError.js'
import Message from '../models/Message.js'
import Chat from '../models/Chat.js'
import User from '../models/User.js'

// @desc    Send a new message
// @route   POST /api/message
// @access  Private
export const sendMessage = asyncHandler(async (req, res) => {
  const { content, chatId } = req.body

  if (!content || !chatId) {
    throw new ApiError('Content and Chat ID are required', 400)
  }

  // Check if chat exists and user is part of it
  const chat = await Chat.findById(chatId)
  console.log('chat', chat) //debug log for chat
  if (!chat) {
    throw new ApiError('Chat not found', 404)
  }

  const isUserInChat = chat.users.includes(req.user._id)
  if (!isUserInChat) {
    throw new ApiError('You are not part of this chat', 403)
  }

  const newMessage = {
    sender: req.user._id,
    content: content,
    chat: chatId,
  }

  let message = await Message.create(newMessage)

  message = await message.populate('sender', 'name avatar')
  message = await message.populate('chat')
  message = await User.populate(message, {
    path: 'chat.users',
    select: 'name avatar email',
  })

  // Update latest message in chat
  await Chat.findByIdAndUpdate(chatId, { latestMessage: message })

  res.status(201).json(
    new ApiResponse(
      true,
      'Message sent successfully',
      message,
      201
    )
  )
})

// @desc    Fetch all messages for a chat
// @route   GET /api/message/:chatId
// @access  Private
export const fetchMessages = asyncHandler(async (req, res) => {
  const { chatId } = req.params

  // Check if chat exists and user is part of it
  const chat = await Chat.findById(chatId)
  if (!chat) {
    throw new ApiError('Chat not found', 404)
  }

  const isUserInChat = chat.users.includes(req.user._id)
  if (!isUserInChat) {
    throw new ApiError('You are not part of this chat', 403)
  }

  const messages = await Message.find({ chat: chatId })
    .populate('sender', 'name avatar')
    .populate('chat')
    .sort({ createdAt: 1 })

  res.json(
    new ApiResponse(
      true,
      'Messages fetched successfully',
      { messages }
    )
  )
})

// @desc    Edit a message
// @route   PUT /api/message/:messageId/edit
// @access  Private
export const editMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params
  const { content } = req.body

  if (!content) {
    throw new ApiError('Content is required', 400)
  }

  const message = await Message.findById(messageId)
  if (!message) {
    throw new ApiError('Message not found', 404)
  }

  // Check if user is the sender
  if (message.sender.toString() !== req.user._id.toString()) {
    throw new ApiError('You can only edit your own messages', 403)
  }

  const updatedMessage = await Message.findByIdAndUpdate(
    messageId,
    {
      content,
      isEdited: true,
      editedAt: new Date(),
    },
    { new: true }
  )
    .populate('sender', 'name avatar')
    .populate('chat')

  res.json(
    new ApiResponse(
      true,
      'Message updated successfully',
      updatedMessage
    )
  )
})

// @desc    Delete a message
// @route   DELETE /api/message/:messageId
// @access  Private
export const deleteMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params

  const message = await Message.findById(messageId).populate('chat')
  if (!message) {
    throw new ApiError('Message not found', 404)
  }

  // ✅ Check if the current user is a member of the chat
  const chat = await Chat.findById(message.chat._id)
  const isMember = chat.users.some(
    (userId) => userId.toString() === req.user._id.toString()
  )

  if (!isMember) {
    throw new ApiError('You are not allowed to delete this message', 403)
  }

  // ✅ Delete the message
  await Message.findByIdAndDelete(messageId)

  res.json(
    new ApiResponse(true, 'Message deleted successfully', null)
  )
})

export const deleteAllMessagesInChat = asyncHandler(async (req, res) => {
  const { chatId } = req.params

  const chat = await Chat.findById(chatId)
  if (!chat) {
    throw new ApiError('Chat not found', 404)
  }

  // ✅ Check if user is a member of the chat
  const isMember = chat.users.some(
    (userId) => userId.toString() === req.user._id.toString()
  )

  if (!isMember) {
    throw new ApiError('You are not allowed to delete messages in this chat', 403)
  }

  // ✅ Delete all messages in the chat
  await Message.deleteMany({ chat: chatId })

  res.json(
    new ApiResponse(true, 'All messages deleted successfully', null)
  )
})

