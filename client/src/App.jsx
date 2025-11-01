import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { getCurrentUser, refreshAccessToken } from '@/store/slices/authSlice'
import { initializeSocket } from '@/lib/socket'
import ProtectedRoute from '@/components/ProtectedRoute'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import ChatPage from '@/pages/ChatPage'
import {store} from "./store/store"

// ✅ NEW IMPORTS
import ForgotPassword from '@/pages/ForgotPassword'
import ResetPassword from '@/pages/ResetPassword'

function App() {
  const dispatch = useDispatch()
  const { isAuthenticated, user } = useSelector((state) => state.auth)

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken')
    if (accessToken && !isAuthenticated) {
      // Try to refresh token first, then get current user
      dispatch(refreshAccessToken()).then((result) => {
        if (result.type === 'auth/refreshAccessToken/rejected') {
          dispatch(getCurrentUser())
        }
      })
    }
  }, [dispatch, isAuthenticated])

  useEffect(() => {
    if (isAuthenticated && user) {
      initializeSocket(user, store)
    }
  }, [isAuthenticated, user])
  
  return (
    <div className="min-h-screen bg-background">
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={!isAuthenticated ? <Login /> : <Navigate to="/" replace />}
        />
        <Route
          path="/register"
          element={!isAuthenticated ? <Register /> : <Navigate to="/" replace />}
        />

        {/* ✅ Forgot & Reset Password Routes */}
        <Route
          path="/forgot-password"
          element={!isAuthenticated ? <ForgotPassword /> : <Navigate to="/" replace />}
        />
        <Route
          path="/reset-password/:token"
          element={!isAuthenticated ? <ResetPassword /> : <Navigate to="/" replace />}
        />

        {/* Protected Route */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App
