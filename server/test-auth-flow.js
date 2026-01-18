import dotenv from 'dotenv'
dotenv.config({ path: './.env' })

import { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken } from './utils/generateToken.js'

console.log('\n🧪 Testing Full JWT Flow\n')
console.log('================================')

try {
  const testUserId = '507f1f77bcf86cd799439011'
  
  // Test 1: Generate access token
  console.log('1️⃣ Generating access token...')
  const accessToken = generateAccessToken(testUserId)
  console.log('   ✅ Access token created')
  console.log('   ', accessToken.substring(0, 60) + '...')
  
  // Test 2: Verify access token
  console.log('\n2️⃣ Verifying access token...')
  const decodedAccess = verifyAccessToken(accessToken)
  console.log('   ✅ Access token verified')
  console.log('   User ID:', decodedAccess.id)
  console.log('   Type:', decodedAccess.type)
  
  // Test 3: Generate refresh token
  console.log('\n3️⃣ Generating refresh token...')
  const refreshToken = generateRefreshToken(testUserId)
  console.log('   ✅ Refresh token created')
  console.log('   ', refreshToken.substring(0, 60) + '...')
  
  // Test 4: Verify refresh token
  console.log('\n4️⃣ Verifying refresh token...')
  const decodedRefresh = verifyRefreshToken(refreshToken)
  console.log('   ✅ Refresh token verified')
  console.log('   User ID:', decodedRefresh.id)
  console.log('   Type:', decodedRefresh.type)
  
  // Test 5: Cross-verification (should fail)
  console.log('\n5️⃣ Testing security (cross-verification)...')
  try {
    verifyRefreshToken(accessToken)
    console.log('   ❌ SECURITY ISSUE: Access token accepted by refresh verifier!')
  } catch (e) {
    console.log('   ✅ Access token correctly rejected by refresh verifier')
  }
  
  try {
    verifyAccessToken(refreshToken)
    console.log('   ❌ SECURITY ISSUE: Refresh token accepted by access verifier!')
  } catch (e) {
    console.log('   ✅ Refresh token correctly rejected by access verifier')
  }
  
  console.log('\n================================')
  console.log('✅ All tests passed!')
  console.log('================================\n')
  
} catch (error) {
  console.error('\n❌ Test failed:', error.message)
  console.error('Stack:', error.stack)
  process.exit(1)
}
