import asyncHandler from '../utils/asyncHandler.js'
import ApiResponse from '../utils/ApiResponse.js'
import ApiError from '../utils/ApiError.js'
import User from '../models/User.js'
import { generateAccessToken, generateRefreshToken } from '../utils/generateToken.js'
import cloudinary from '../utils/cloudinary.js'
import fs from 'fs'

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body

  // Check if user exists
  const userExists = await User.findOne({ email })
  if (userExists) {
    throw new ApiError('User already exists', 400)
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
  })

  if (user) {
    const accessToken = generateAccessToken(user._id)
    const refreshToken = generateRefreshToken()
    
    // Store refresh token in database
    const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    user.refreshTokens.push({
      token: refreshToken,
      expiresAt: refreshTokenExpiry,
    })
    await user.save()
    
    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    })
    
    res.status(201).json(
      new ApiResponse(
        true,
        'User registered successfully',
        {
          user,
          accessToken,
        },
        201
      )
    )
  } else {
    throw new ApiError('Invalid user data', 400)
  }
})

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  // Check for user
  const user = await User.findOne({ email })
  if (!user) {
    throw new ApiError('Invalid credentials', 401)
  }

  // Check password
  const isMatch = await user.matchPassword(password)
  if (!isMatch) {
    throw new ApiError('Invalid credentials', 401)
  }

  // Update online status
  user.isOnline = true
  user.lastSeen = new Date()
  
  // Generate new tokens
  const accessToken = generateAccessToken(user._id)
  const refreshToken = generateRefreshToken()
  
  // Store refresh token in database
  const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  user.refreshTokens.push({
    token: refreshToken,
    expiresAt: refreshTokenExpiry,
  })
  
  // Clean up old refresh tokens (keep only last 5)
  if (user.refreshTokens.length > 5) {
    user.refreshTokens = user.refreshTokens.slice(-5)
  }
  
  await user.save()

  // Set refresh token as httpOnly cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  })

  res.json(
    new ApiResponse(
      true,
      'Login successful',
      {
        user,
        accessToken,
        //avatar: user.avatar,
      }
    )
  )
})

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
  
  res.json(
    new ApiResponse(
      true,
      'User retrieved successfully',
      { user }
    )
  )
})

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
export const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.cookies

  if (!refreshToken) {
    throw new ApiError('No refresh token provided', 401)
  }

  // Find user with this refresh token
  const user = await User.findOne({
    'refreshTokens.token': refreshToken,
    'refreshTokens.expiresAt': { $gt: new Date() }
  })

  if (!user) {
    throw new ApiError('Invalid or expired refresh token', 401)
  }

  // Generate new access token
  const accessToken = generateAccessToken(user._id)

  // Update user online status
  user.isOnline = true
  user.lastSeen = new Date()
  await user.save()

  res.json(
    new ApiResponse(
      true,
      'Token refreshed successfully',
      {
        user,
        accessToken,
      }
    )
  )
})

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logoutUser = asyncHandler(async (req, res) => {
  const { refreshToken } = req.cookies

  if (req.user) {
    // Update offline status
    await User.findByIdAndUpdate(req.user._id, {
      isOnline: false,
      lastSeen: new Date(),
    })

    // Remove refresh token from database
    if (refreshToken) {
      await User.findByIdAndUpdate(req.user._id, {
        $pull: { refreshTokens: { token: refreshToken } }
      })
    }
  }

  // Clear refresh token cookie
  res.clearCookie('refreshToken')

  res.json(
    new ApiResponse(
      true,
      'Logout successful',
      null
    )
  )
})

// @desc    Search users
// @route   GET /api/auth/search
// @access  Private
export const searchUsers = asyncHandler(async (req, res) => {
  const { q } = req.query

  if (!q) {
    throw new ApiError('Search query is required', 400)
  }

  const users = await User.find({
    $and: [
      { _id: { $ne: req.user._id } }, // Exclude current user
      {
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } },
        ],
      },
    ],
  }).limit(10)

  res.json(
    new ApiResponse(
      true,
      'Users found',
      { users }
    )
  )
})


import crypto from 'crypto'
import sendEmail from '../utils/sendEmail.js' // 📩 we'll create this below

// @desc    Forgot Password - send reset email
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body

  const user = await User.findOne({ email })
  if (!user) {
    throw new ApiError('User not found with this email', 404)
  }

  // Generate reset token
  const resetToken = user.getResetPasswordToken()
  await user.save({ validateBeforeSave: false })

  // Create reset URL
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`

  const message = `
    You requested a password reset. Please click the link below to reset your password:\n\n
    ${resetUrl}\n\n
    If you did not request this, please ignore this email.
  `

  try {
    await sendEmail({
      email: user.email,
      subject: 'Password Reset Request',
      message,
    })

    res.status(200).json(
      new ApiResponse(true, 'Password reset link sent to your email', null)
    )
  } catch (error) {
    // Clean up if email fails
    user.resetPasswordToken = undefined
    user.resetPasswordExpires = undefined
    await user.save({ validateBeforeSave: false })
    throw new ApiError('Email could not be sent. Try again later.', 500)
  }
})

// @desc    Reset Password
// @route   POST /api/auth/reset-password/:token
// @access  Public
export const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body
  const { token } = req.params

  const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex')

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpires: { $gt: Date.now() }, // valid token
  })

  if (!user) {
    throw new ApiError('Invalid or expired reset token', 400)
  }

  user.password = password
  user.resetPasswordToken = undefined
  user.resetPasswordExpires = undefined
  await user.save()

  res.status(200).json(new ApiResponse(true, 'Password reset successful', null))
})



// @desc    Upload or update user avatar
// @route   POST /api/auth/avatar
// @access  Private
/*
export const uploadAvatar = asyncHandler(async (req, res) => {
  console.log('Avatar upload request received');
  console.log('User:', req.user?._id);
  console.log('File:', req.file ? 'Present' : 'Missing');

  if (!req.file) {
    console.log('No file uploaded');
    throw new ApiError('No file uploaded', 400);
  }

  // Construct the avatar URL to be saved in the database
  //const avatarUrl = `/avatars/${req.file.filename}`;
  const avatarUrl = `${req.protocol}://${req.get('host')}/avatars/${req.file.filename}`;
  console.log('Avatar URL:', avatarUrl);

  // Update user avatar URL in MongoDB
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { avatar: avatarUrl },
    { new: true }
  );

  console.log('User updated in MongoDB:', user?.avatar);

  res.status(200).json(new ApiResponse(true, 'Avatar updated', { user }));
});

*/

export const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' })
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'chatapp/avatars',
    })

    // Remove local temp file
    fs.unlinkSync(req.file.path)

    // Update user record
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: result.secure_url },
      { new: true }
    )

    res.status(200).json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: { avatar: user.avatar },
    })
  } catch (error) {
    next(error)
  }
}