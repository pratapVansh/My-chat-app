import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '@/lib/api'
import { disconnectSocket } from '@/lib/socket' // import your socket disconnect function

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/login', userData)
      return response.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Login failed')
    }
  }
)

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/register', userData)
      return response.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Registration failed')
    }
  }
)

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/auth/me')
      return response.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get user')
    }
  }
)

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      await api.post('/auth/logout')
      // disconnect the socket after logout
      disconnectSocket()
      return null
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Logout failed')
    }
  }
)

export const searchUsers = createAsyncThunk(
  'auth/searchUsers',
  async (searchQuery, { rejectWithValue }) => {
    try {
      const response = await api.get(`/auth/search?q=${searchQuery}`)
      return response.data.data.users
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Search failed')
    }
  }
)



export const uploadAvatar = createAsyncThunk(
  'auth/uploadAvatar',
  async (file, { rejectWithValue, getState  }) => {
    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const { data } = await api.post('/auth/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      // The backend sends ApiResponse(true, 'Avatar updated', { user })
      const currentUser = getState().auth.user
      return {
        ...currentUser,
        avatar: data.data.avatar
      }
    } catch (error) {
      console.error('Avatar upload failed:', error)
      return rejectWithValue(error.response?.data?.message || 'Avatar upload failed')
    }
  }
)


// Forgot Password
export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (email, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/forgot-password', { email })
      return response.data.message // success message from backend
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send reset email')
    }
  }
)

// Reset Password
export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ token, password }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/auth/reset-password/${token}`, { password })
      return response.data.message
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reset password')
    }
  }
)


export const refreshAccessToken = createAsyncThunk(
  'auth/refreshAccessToken',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/refresh')
      return response.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Token refresh failed')
    }
  }
)

const getStoredUser = () => {
  try {
    const user = localStorage.getItem('user')

    if (!user || user === 'undefined' || user === 'null') {
      localStorage.removeItem('user')
      return null
    }

    return JSON.parse(user)
  } catch (error) {
    console.error('Error parsing stored user:', error)
    localStorage.removeItem('user')
    return null
  }
}

const initialState = {
  user: getStoredUser(),
  isAuthenticated: !!localStorage.getItem('accessToken'),
  loading: false,
  error: null,
  searchResults: [],
  searchLoading: false,
  resetSuccess: null,      
  forgotEmailSent: false,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    clearSearchResults: (state) => {
      state.searchResults = []
    },
    setUser: (state, action) => {
      state.user = action.payload
      state.isAuthenticated = !!action.payload
      if (action.payload) {
        localStorage.setItem('user', JSON.stringify(action.payload))
      } else {
        localStorage.removeItem('user')
        localStorage.removeItem('accessToken')
      }
    },
    clearAuth: (state) => {
      state.user = null
      state.isAuthenticated = false
      localStorage.removeItem('user')
      localStorage.removeItem('accessToken')
    },
    clearForgotResetState: (state) => {
      state.forgotSuccess = false
      state.resetSuccess = false
      state.error = null
    }
    
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.isAuthenticated = true
        state.error = null
        localStorage.setItem('user', JSON.stringify(action.payload.user))
        if (action.payload?.accessToken) {
          localStorage.setItem('accessToken', action.payload.accessToken)
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        state.isAuthenticated = false
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.isAuthenticated = true
        state.error = null
        localStorage.setItem('user', JSON.stringify(action.payload.user))
        if (action.payload?.accessToken) {
          localStorage.setItem('accessToken', action.payload.accessToken)
        }
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        state.isAuthenticated = false
      })
      // Get Current User
      .addCase(getCurrentUser.pending, (state) => {
        state.loading = true
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.isAuthenticated = true
        localStorage.setItem('user', JSON.stringify(action.payload.user))
      })
      .addCase(getCurrentUser.rejected, (state) => {
        state.loading = false
        state.user = null
        state.isAuthenticated = false
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null
        state.isAuthenticated = false
        state.error = null
        localStorage.removeItem('user')
        localStorage.removeItem('accessToken')
      })
      // Search Users
      .addCase(searchUsers.pending, (state) => {
        state.searchLoading = true
      })
      .addCase(searchUsers.fulfilled, (state, action) => {
        state.searchLoading = false
        state.searchResults = action.payload
      })
      .addCase(searchUsers.rejected, (state) => {
        state.searchLoading = false
        state.searchResults = []
      })
      // ====== UPLOAD AVATAR (Cloudinary) ======
      .addCase(uploadAvatar.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(uploadAvatar.fulfilled, (state, action) => {
        state.loading = false
        // Update avatar only (to avoid overwriting other fields)
        if (state.user) {
          state.user.avatar = action.payload.avatar
        } else {
          state.user = action.payload
        }
        localStorage.setItem('user', JSON.stringify(state.user))
      })
      .addCase(uploadAvatar.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Refresh Token
      .addCase(refreshAccessToken.fulfilled, (state, action) => {
        state.user = action.payload.user
        state.isAuthenticated = true
        localStorage.setItem('user', JSON.stringify(action.payload.user))
        if (action.payload?.accessToken) {
          localStorage.setItem('accessToken', action.payload.accessToken)
        }
      })
      .addCase(refreshAccessToken.rejected, (state) => {
        state.user = null
        state.isAuthenticated = false
        localStorage.removeItem('user')
        localStorage.removeItem('accessToken')
      })
      // Forgot Password
      .addCase(forgotPassword.pending, (state) => {
        state.loading = true
        state.error = null
        state.forgotEmailSent = false
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.loading = false
        state.forgotEmailSent = true
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        state.forgotEmailSent = false
      })

      // Reset Password
      .addCase(resetPassword.pending, (state) => {
        state.loading = true
        state.error = null
        state.resetSuccess = null
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.loading = false
        state.resetSuccess = true
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        state.resetSuccess = false
      })

  },
})

export const { clearError, clearSearchResults, setUser, clearAuth,clearForgotResetState } = authSlice.actions
export default authSlice.reducer


/*import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '@/lib/api'

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/login', userData)
      return response.data.data //response.data 
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Login failed')
    }
  }
)

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/register', userData)
      return response.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Registration failed')
    }
  }
)

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/auth/me')
      return response.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get user')
    }
  }
)

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      await api.post('/auth/logout')
      return null
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Logout failed')
    }
  }
)

export const searchUsers = createAsyncThunk(
  'auth/searchUsers',
  async (searchQuery, { rejectWithValue }) => {
    try {
      const response = await api.get(`/auth/search?q=${searchQuery}`)
      return response.data.data.users
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Search failed')
    }
  }
)

export const uploadAvatar = createAsyncThunk(
  'auth/uploadAvatar',
  async (file, { rejectWithValue }) => {
    try {
      const formData = new FormData()
      formData.append('avatar', file)
      const response = await api.post('/auth/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return response.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Avatar upload failed')
    }
  }
)

export const refreshAccessToken = createAsyncThunk(
  'auth/refreshAccessToken',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/refresh')
      return response.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Token refresh failed')
    }
  }
)

const getStoredUser = () => {
  try {
    const user = localStorage.getItem('user')

    // handle invalid values
    if (!user || user === 'undefined' || user === 'null') {
      localStorage.removeItem('user')
      return null
    }

    return JSON.parse(user)
  } catch (error) {
    console.error('Error parsing stored user:', error)
    localStorage.removeItem('user')
    return null
  }
}


const initialState = {
  user: getStoredUser(),
  isAuthenticated: !!localStorage.getItem('accessToken'),
  loading: false,
  error: null,
  searchResults: [],
  searchLoading: false,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    clearSearchResults: (state) => {
      state.searchResults = []
    },
    setUser: (state, action) => {
      state.user = action.payload
      state.isAuthenticated = !!action.payload
      if (action.payload) {
        localStorage.setItem('user', JSON.stringify(action.payload))
      } else {
        localStorage.removeItem('user')
        localStorage.removeItem('accessToken')
      }
    },
    clearAuth: (state) => {
      state.user = null
      state.isAuthenticated = false
      localStorage.removeItem('user')
      localStorage.removeItem('accessToken')
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.isAuthenticated = true
        state.error = null
        localStorage.setItem('user', JSON.stringify(action.payload.user))
        if (action.payload?.accessToken) {
          localStorage.setItem('accessToken', action.payload.accessToken)
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        state.isAuthenticated = false
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.isAuthenticated = true
        state.error = null
        localStorage.setItem('user', JSON.stringify(action.payload.user))
        if (action.payload?.accessToken) {
          localStorage.setItem('accessToken', action.payload.accessToken)
        }
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        state.isAuthenticated = false
      })
      // Get Current User
      .addCase(getCurrentUser.pending, (state) => {
        state.loading = true
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.isAuthenticated = true
        localStorage.setItem('user', JSON.stringify(action.payload.user))
      })
      .addCase(getCurrentUser.rejected, (state) => {
        state.loading = false
        state.user = null
        state.isAuthenticated = false
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null
        state.isAuthenticated = false
        state.error = null
        localStorage.removeItem('user')
        localStorage.removeItem('accessToken')
      })
      // Search Users
      .addCase(searchUsers.pending, (state) => {
        state.searchLoading = true
      })
      .addCase(searchUsers.fulfilled, (state, action) => {
        state.searchLoading = false
        state.searchResults = action.payload //action.payload.users
      })
      .addCase(searchUsers.rejected, (state) => {
        state.searchLoading = false
        state.searchResults = []
      })
      // Upload Avatar
      .addCase(uploadAvatar.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(uploadAvatar.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        localStorage.setItem('user', JSON.stringify(action.payload.user))
      })
      .addCase(uploadAvatar.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Refresh Token
      .addCase(refreshAccessToken.fulfilled, (state, action) => {
        state.user = action.payload.user
        state.isAuthenticated = true
        localStorage.setItem('user', JSON.stringify(action.payload.user))
        if (action.payload?.accessToken) {
          localStorage.setItem('accessToken', action.payload.accessToken)
        }
      })
      .addCase(refreshAccessToken.rejected, (state) => {
        state.user = null
        state.isAuthenticated = false
        localStorage.removeItem('user')
        localStorage.removeItem('accessToken')
      })
  },
})

export const { clearError, clearSearchResults, setUser, clearAuth } = authSlice.actions
export default authSlice.reducer*/
