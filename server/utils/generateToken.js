import jwt from 'jsonwebtoken'
import crypto from 'crypto'

export const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '15m',
  })
}

export const generateRefreshToken = () => {
  return crypto.randomBytes(40).toString('hex')
}

export const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  })
}
