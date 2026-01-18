/**
 * Clear Authentication Utility
 * 
 * Run this in your browser console if you're experiencing login issues
 * or "invalid signature" errors
 */

export const clearAuth = () => {
  console.log('🧹 Clearing authentication data...')
  
  // Clear localStorage
  const keysToRemove = ['accessToken', 'user']
  keysToRemove.forEach(key => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key)
      console.log(`✅ Removed ${key} from localStorage`)
    }
  })
  
  // Clear all cookies
  document.cookie.split(';').forEach(cookie => {
    const name = cookie.split('=')[0].trim()
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
    console.log(`✅ Removed cookie: ${name}`)
  })
  
  console.log('✅ Authentication data cleared!')
  console.log('🔄 Redirecting to login...')
  
  setTimeout(() => {
    window.location.href = '/login'
  }, 1000)
}

// Make it available globally for console use
if (typeof window !== 'undefined') {
  window.clearAuth = clearAuth
}

export default clearAuth
