import jwt from 'jsonwebtoken'

/**
 * Generate Access Token (Short-lived)
 * Used for authenticating API requests
 * Verified by auth middleware
 */
export const generateAccessToken = (userId) => {
  if (!process.env.ACCESS_TOKEN_SECRET) {
    throw new Error('ACCESS_TOKEN_SECRET is not defined in environment variables')
  }
  
  return jwt.sign(
    { id: userId, type: 'access' },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRE || '15m' }
  )
}

/**
 * Generate Refresh Token (Long-lived)
 * Used only for refreshing access tokens
 * NOT accepted in Authorization header
 */
export const generateRefreshToken = (userId) => {
  if (!process.env.REFRESH_TOKEN_SECRET) {
    throw new Error('REFRESH_TOKEN_SECRET is not defined in environment variables')
  }
  
  return jwt.sign(
    { id: userId, type: 'refresh' },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRE || '7d' }
  )
}

/**
 * Verify Access Token
 */
export const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
}

/**
 * Verify Refresh Token
 */
export const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET)
}
