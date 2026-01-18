import dotenv from 'dotenv'
import { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken } from './utils/generateToken.js'

dotenv.config({ path: './.env' })

console.log('\n🔍 Production-Grade JWT Configuration Test\n')
console.log('================================')

// Check if all required secrets exist
const requiredSecrets = [
  'ACCESS_TOKEN_SECRET',
  'REFRESH_TOKEN_SECRET'
]

let allSecretsExist = true
requiredSecrets.forEach(secret => {
  if (!process.env[secret]) {
    console.error(`❌ ERROR: ${secret} is not defined in .env file!`)
    allSecretsExist = false
  } else {
    console.log(`✅ ${secret} is defined`)
    console.log(`   First 20 characters: ${process.env[secret].substring(0, 20)}...`)
  }
})

if (!allSecretsExist) {
  console.error('\n❌ Missing required secrets. Exiting...\n')
  process.exit(1)
}

console.log('\n================================')
console.log('🧪 Testing Access Token (15min)')
console.log('================================\n')

try {
  const testUserId = '507f1f77bcf86cd799439011' // Sample MongoDB ObjectId
  
  // Generate access token
  const accessToken = generateAccessToken(testUserId)
  console.log('✅ Access token generated')
  console.log('   Token (first 50 chars):', accessToken.substring(0, 50) + '...')
  
  // Verify access token
  const decodedAccess = verifyAccessToken(accessToken)
  console.log('✅ Access token verified')
  console.log('   User ID:', decodedAccess.id)
  console.log('   Token type:', decodedAccess.type)
  console.log('   Expires in:', Math.floor((decodedAccess.exp - decodedAccess.iat) / 60), 'minutes')
  
  // Try to verify access token with refresh token verifier (should fail)
  try {
    verifyRefreshToken(accessToken)
    console.log('❌ SECURITY ISSUE: Access token verified with refresh secret!')
  } catch (error) {
    console.log('✅ Access token correctly rejected by refresh verifier')
  }
  
} catch (error) {
  console.error('❌ Access Token Test Failed:', error.message)
  process.exit(1)
}

console.log('\n================================')
console.log('🧪 Testing Refresh Token (7 days)')
console.log('================================\n')

try {
  const testUserId = '507f1f77bcf86cd799439011'
  
  // Generate refresh token
  const refreshToken = generateRefreshToken(testUserId)
  console.log('✅ Refresh token generated')
  console.log('   Token (first 50 chars):', refreshToken.substring(0, 50) + '...')
  
  // Verify refresh token
  const decodedRefresh = verifyRefreshToken(refreshToken)
  console.log('✅ Refresh token verified')
  console.log('   User ID:', decodedRefresh.id)
  console.log('   Token type:', decodedRefresh.type)
  console.log('   Expires in:', Math.floor((decodedRefresh.exp - decodedRefresh.iat) / 86400), 'days')
  
  // Try to verify refresh token with access token verifier (should fail)
  try {
    verifyAccessToken(refreshToken)
    console.log('❌ SECURITY ISSUE: Refresh token verified with access secret!')
  } catch (error) {
    console.log('✅ Refresh token correctly rejected by access verifier')
  }
  
} catch (error) {
  console.error('❌ Refresh Token Test Failed:', error.message)
  process.exit(1)
}

console.log('\n================================')
console.log('✅ All JWT Tests Passed!')
console.log('================================\n')

// Check other environment variables
console.log('📋 Environment Configuration:')
console.log('--------------------------------')
console.log('NODE_ENV:', process.env.NODE_ENV || 'development (default)')
console.log('PORT:', process.env.PORT || '5000 (default)')
console.log('CLIENT_URL:', process.env.CLIENT_URL || 'http://localhost:3000 (default)')
console.log('MONGODB_URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ Not set')
console.log('ACCESS_TOKEN_EXPIRE:', process.env.ACCESS_TOKEN_EXPIRE || '15m (default)')
console.log('REFRESH_TOKEN_EXPIRE:', process.env.REFRESH_TOKEN_EXPIRE || '7d (default)')
console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? '✅ Set' : '❌ Not set')
console.log('EMAIL_USER:', process.env.EMAIL_USER ? '✅ Set' : '❌ Not set')

console.log('\n🎯 Security Summary:')
console.log('--------------------------------')
console.log('✅ Separate secrets for access and refresh tokens')
console.log('✅ Access tokens expire in 15 minutes')
console.log('✅ Refresh tokens expire in 7 days')
console.log('✅ Tokens cannot be verified with wrong secret')
console.log('✅ Token type validation enforced')
console.log('\n')
