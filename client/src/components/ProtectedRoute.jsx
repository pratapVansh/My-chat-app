import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Navigate } from 'react-router-dom'
import { getCurrentUser, refreshAccessToken } from '@/store/slices/authSlice'
import { initializeSocket } from '@/lib/socket'
import { store } from '@/store/store'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useSelector((state) => state.auth)
  const dispatch = useDispatch()

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken')
    if (accessToken && !isAuthenticated) {
      // Try to get current user first, which will handle token refresh automatically
      dispatch(getCurrentUser())
    }
  }, [dispatch, isAuthenticated])

  useEffect(() => {
    if (isAuthenticated && user) {
      initializeSocket(user, store)
    }
  }, [isAuthenticated, user])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />
}

export default ProtectedRoute
