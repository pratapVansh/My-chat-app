import asyncHandler from '../utils/asyncHandler.js'
import ApiResponse from '../utils/ApiResponse.js'
import ApiError from '../utils/ApiError.js'
import Chat from '../models/Chat.js'
import User from '../models/User.js'
import Message from '../models/Message.js'
import fs from 'fs'
import cloudinary from '../utils/cloudinary.js'



// @desc    Fetch all chats for a user
// @route   GET /api/chat
// @access  Private
export const fetchChats = asyncHandler(async (req, res) => {
  const chats = await Chat.find({ users: { $elemMatch: { $eq: req.user._id } } })
    .populate('users', '-password')
    .populate('groupAdmin', '-password')
    .populate('latestMessage')
    .sort({ updatedAt: -1 })

  res.json(
    new ApiResponse(
      true,
      'Chats fetched successfully',
      { chats }
    )
  )
})

// @desc    Create a new chat or fetch existing one
// @route   POST /api/chat
// @access  Private
export const createChat = asyncHandler(async (req, res) => {
  const { userId } = req.body

  if (!userId) {
    throw new ApiError('User ID is required', 400)
  }

  // Check if chat already exists between these two users
  let chat = await Chat.find({
    isGroupChat: false,
    $and: [
      { users: { $elemMatch: { $eq: req.user._id } } },
      { users: { $elemMatch: { $eq: userId } } },
    ],
  })
    .populate('users', '-password')
    .populate('latestMessage')

  if (chat.length > 0) {
    // Chat already exists
    res.json(
      new ApiResponse(
        true,
        'Chat fetched successfully',
        chat[0]
      )
    )
  } else {
    // Create new chat
    const chatData = {
      chatName: 'sender',
      isGroupChat: false,
      users: [req.user._id, userId],
    }

    const createdChat = await Chat.create(chatData)
    
    const fullChat = await Chat.findOne({ _id: createdChat._id }).populate(
      'users',
      '-password'
    )

    res.status(201).json(
      new ApiResponse(
        true,
        'Chat created successfully',
        fullChat,
        201
      )
    )
  }
})


/*export const createChat = asyncHandler(async (req, res) => {
  const { userId } = req.body

  if (!userId) {
    throw new ApiError('User ID is required', 400)
  }

  // Check if chat already exists between these two users
  let chat = await Chat.findOne({
    isGroupChat: false,
    users: { $all: [req.user._id, userId] }
  })
    .populate('users', '-password')
    .populate('latestMessage')

  if (chat) {
    // Chat already exists
    return res.status(200).json(chat) // ✅ always includes _id
  }

  // Create new chat
  const createdChat = await Chat.create({
    chatName: 'sender',
    isGroupChat: false,
    users: [req.user._id, userId],
  })

  const fullChat = await Chat.findById(createdChat._id).populate('users', '-password')

  res.status(201).json(fullChat) // ✅ ensure _id is present
})
*/

// @desc    Create a new group chat
// @route   POST /api/chat/group
// @access  Private
export const createGroupChat = asyncHandler(async (req, res) => {
  const { name, users } = req.body

  if (!name || !users || users.length < 2) {
    throw new ApiError('Please provide a group name and at least 2 users', 400)
  }

  // Add current user to the group
  users.push(req.user._id)

  const groupChat = await Chat.create({
    chatName: name,
    users: users,
    isGroupChat: true,
    groupAdmin: req.user._id,
  })

  const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
    .populate('users', '-password')
    .populate('groupAdmin', '-password')

  res.status(201).json(
    new ApiResponse(
      true,
      'Group chat created successfully',
      fullGroupChat,
      201
    )
  )
})

/*
export const createGroupChat = asyncHandler(async (req, res) => {
  const { name, users } = req.body

  if (!name || !users || users.length < 2) {
    throw new ApiError('Please provide a group name and at least 2 users', 400)
  }

  // Add current user to the group
  const groupUsers = [...users, req.user._id]

  const groupChat = await Chat.create({
    chatName: name,
    users: groupUsers,
    isGroupChat: true,
    groupAdmin: req.user._id,
  })

  const fullGroupChat = await Chat.findById(groupChat._id)
    .populate('users', '-password')
    .populate('groupAdmin', '-password')

  res.status(201).json(fullGroupChat) // ✅ ensure _id is present
})
*/

// @desc    Update a group chat
// @route   PUT /api/chat/group/:chatId
// @access  Private
export const updateGroupChat = asyncHandler(async (req, res) => {
  const { chatId } = req.params
  const { chatName, users } = req.body

  const chat = await Chat.findById(chatId)

  if (!chat) {
    throw new ApiError('Chat not found', 404)
  }

  if (!chat.isGroupChat) {
    throw new ApiError('This is not a group chat', 400)
  }

  // Check if user is admin
  if (chat.groupAdmin.toString() !== req.user._id.toString()) {
    throw new ApiError('Only group admin can update the group', 403)
  }

  const updatedChat = await Chat.findByIdAndUpdate(
    chatId,
    {
      chatName: chatName || chat.chatName,
      users: users || chat.users,
    },
    { new: true }
  )
    .populate('users', '-password')
    .populate('groupAdmin', '-password')

  res.json(
    new ApiResponse(
      true,
      'Group chat updated successfully',
      updatedChat
    )
  )
})

// @desc    Delete a group chat
// @route   DELETE /api/chat/group/:chatId
// @access  Private
export const deleteGroupChat = asyncHandler(async (req, res) => {
  const { chatId } = req.params

  const chat = await Chat.findById(chatId)

  if (!chat) {
    throw new ApiError('Chat not found', 404)
  }

  if (!chat.isGroupChat) {
    throw new ApiError('This is not a group chat', 400)
  }

  // Check if user is admin
  if (chat.groupAdmin.toString() !== req.user._id.toString()) {
    throw new ApiError('Only group admin can delete the group', 403)
  }

  await Chat.findByIdAndDelete(chatId)

  res.json(
    new ApiResponse(
      true,
      'Group chat deleted successfully',
      null
    )
  )
})

export const deleteChat = asyncHandler(async (req, res) => {
  const { chatId } = req.params

  const chat = await Chat.findById(chatId)
  if (!chat) throw new ApiError('Chat not found', 404)

  // ✅ Ensure user is part of the chat
  const isMember = chat.users.some(
    (userId) => userId.toString() === req.user._id.toString()
  )

  if (!isMember) {
    throw new ApiError('You are not allowed to delete this chat', 403)
  }

  // ✅ Delete all messages associated with the chat
  await Message.deleteMany({ chat: chatId })

  // ✅ Delete the chat itself
  await Chat.findByIdAndDelete(chatId)

  res.json(new ApiResponse(true, 'Chat deleted successfully', null))
})


export const updateGroupAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' })
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'chatapp/group_avatars',
    })

    fs.unlinkSync(req.file.path)

    const chat = await Chat.findByIdAndUpdate(
      req.params.chatId,
      { groupAvatar: result.secure_url },
      { new: true }
    ).populate('groupAdmin', 'name email avatar')

    res.status(200).json({
      success: true,
      message: 'Group avatar updated successfully',
      data: chat,
    })
  } catch (error) {
    next(error)
  }
}













/*
// @desc    Update group avatar
// @route   PUT /api/chat/:chatId/avatar
// @access  Private (only admin and only for group chats)
export const updateGroupAvatar = asyncHandler(async (req, res) => {
  const { chatId } = req.params;

  // Find chat
  const chat = await Chat.findById(chatId)
    .populate('users', 'name email avatar')
    .populate('groupAdmin', 'name email avatar');

  // Chat validation
  if (!chat) {
    throw new ApiError('Chat not found', 404);
  }

  // Restrict to group chats only
  if (!chat.isGroupChat) {
    throw new ApiError('Avatar can only be set for group chats', 400);
  }

  // Only group admin can update
  if (chat.groupAdmin._id.toString() !== req.user._id.toString()) {
    throw new ApiError('Only group admin can change the group avatar', 403);
  }

  // File validation
  if (!req.file) {
    throw new ApiError('No avatar file provided', 400);
  }

  // (Optional) Delete old avatar if exists
  // import fs and path at top if you use this
  /*
  if (chat.groupAvatar) {
    const oldPath = path.join('public', chat.groupAvatar);
    fs.unlink(oldPath, (err) => {
      if (err) console.warn('Failed to delete old avatar:', err);
    });
  }
  */
 
/*
  // Save new local path
  chat.groupAvatar = `${req.protocol}://${req.get('host')}/avatars/${req.file.filename}`;
  await chat.save();

  // Re-populate to return fresh updated data
  await chat.populate('users', 'name email avatar');
  await chat.populate('groupAdmin', 'name email avatar');

  res.json(
    new ApiResponse(
      true,
      'Group avatar updated successfully',
      chat
    )
  );
});
*/

