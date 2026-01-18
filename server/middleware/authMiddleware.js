import User from '../models/User.js'
import { verifyAccessToken } from '../utils/generateToken.js'

/**
 * Protect Middleware - Verifies Access Token ONLY
 * 
 * Requirements:
 * - Token must be in Authorization header as "Bearer <token>"
 * - Token must be signed with ACCESS_TOKEN_SECRET
 * - Refresh tokens are NOT accepted here
 * - Returns 401 for any invalid/expired/missing tokens
 */
const protect = async (req, res, next) => {
  try {
    // Check for Authorization header
    if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer')) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token provided',
      })
    }

    // Extract token
    const token = req.headers.authorization.split(' ')[1]

    // Validate token format
    if (!token || token === 'undefined' || token === 'null') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, invalid token format',
      })
    }

    // Verify token with ACCESS_TOKEN_SECRET
    let decoded
    try {
      decoded = verifyAccessToken(token)
    } catch (error) {
      // Specific error messages for different JWT errors
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Access token expired',
          code: 'TOKEN_EXPIRED',
        })
      } else if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid access token',
          code: 'INVALID_TOKEN',
        })
      } else {
        return res.status(401).json({
          success: false,
          message: 'Token verification failed',
          code: 'VERIFICATION_FAILED',
        })
      }
    }

    // Ensure it's an access token (not a refresh token)
    if (decoded.type !== 'access') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token type. Access token required',
        code: 'WRONG_TOKEN_TYPE',
      })
    }

    // Get user from token
    const user = await User.findById(decoded.id).select('-password')

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND',
      })
    }

    // Attach user to request
    req.user = user
    next()
    
  } catch (error) {
    console.error('Auth middleware error:', error)
    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
      code: 'AUTH_FAILED',
    })
  }
}

export { protect }
