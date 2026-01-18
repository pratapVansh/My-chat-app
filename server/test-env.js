import dotenv from 'dotenv'
dotenv.config({ path: './.env' })

console.log('\n🔍 Environment Variable Test')
console.log('================================')
console.log('NODE_ENV:', process.env.NODE_ENV)
console.log('PORT:', process.env.PORT)
console.log('ACCESS_TOKEN_SECRET:', process.env.ACCESS_TOKEN_SECRET ? '✅ Loaded (length: ' + process.env.ACCESS_TOKEN_SECRET.length + ')' : '❌ Missing')
console.log('REFRESH_TOKEN_SECRET:', process.env.REFRESH_TOKEN_SECRET ? '✅ Loaded (length: ' + process.env.REFRESH_TOKEN_SECRET.length + ')' : '❌ Missing')
console.log('ACCESS_TOKEN_EXPIRE:', process.env.ACCESS_TOKEN_EXPIRE)
console.log('REFRESH_TOKEN_EXPIRE:', process.env.REFRESH_TOKEN_EXPIRE)
console.log('================================\n')
