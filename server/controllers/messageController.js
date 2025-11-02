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

  // ✅ Filter out messages deleted by the current user
  const filteredMessages = messages
    .map((message) => {
      const messageObj = message.toObject()
      
      // If deleted for all, show deleted content to everyone
      if (message.deletedForAll) {
        messageObj.content = 'This message was deleted'
        messageObj.isDeleted = true
        return messageObj
      }
      
      // If current user deleted it for themselves, don't show it
      const isDeletedForUser = message.deletedFor.some(
        (userId) => userId.toString() === req.user._id.toString()
      )
      
      if (isDeletedForUser) {
        return null // Filter out completely
      }
      
      return messageObj
    })
    .filter((msg) => msg !== null) // Remove null entries

  res.json(
    new ApiResponse(
      true,
      'Messages fetched successfully',
      { messages: filteredMessages }
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
  const { messageId } = req.params;

  const message = await Message.findById(messageId).populate('chat');
  if (!message) {
    throw new ApiError('Message not found', 404);
  }

  // Check if the current user is a member of the chat
  const chat = await Chat.findById(message.chat._id);
  const isMember = chat.users.some(
    (userId) => userId.toString() === req.user._id.toString()
  );

  if (!isMember) {
    throw new ApiError('You are not allowed to delete this message', 403);
  }

  const isSender = message.sender.toString() === req.user._id.toString();

  if (isSender) {
    // Sender deletes: Delete for everyone
    message.deletedForAll = true;
    message.isDeleted = true;
    message.content = 'This message was deleted';
    await message.save();
  } else {
    // Receiver deletes: Delete only for them
    if (!message.deletedFor.includes(req.user._id)) {
      message.deletedFor.push(req.user._id);
      await message.save();
    }
  }

  // Repopulate with full chat data before emitting
  const updatedMessage = await Message.findById(messageId)
    .populate('sender', 'name avatar')
    .populate({
      path: 'chat',
      populate: { path: 'users', select: 'name avatar email' },
    });

  // Fetch last non-deleted message in chat to update chat preview
  const lastMessages = await Message.find({
    chat: updatedMessage.chat._id,
    isDeleted: { $ne: true },
  })
    .sort({ createdAt: -1 })
    .limit(1)
    .populate('sender', 'name avatar');

  const lastMessage = lastMessages.length > 0 ? lastMessages[0] : null;

  if (updatedMessage?.chat?._id) {
    req.io?.to(updatedMessage.chat._id.toString()).emit('message deleted', {
      chatId: updatedMessage.chat._id.toString(),
      deletedMessageIds: [updatedMessage._id.toString()],
      lastMessage,
      updatedMessage,
    });
  } else {
    console.warn('⚠️ Chat not found for deleted message:', messageId);
  }

  res.json(new ApiResponse(true, 'Message deleted successfully', updatedMessage));
});
// @desc    Delete all messages in a chat
// @route   DELETE /api/message/chat/:chatId
// @access  Private
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