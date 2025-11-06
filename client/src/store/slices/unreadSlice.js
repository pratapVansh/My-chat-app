import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '@/lib/api'

// Async thunks for unread message functionality only
export const fetchUnreadCounts = createAsyncThunk(
  'unread/fetchUnreadCounts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/message/unread-counts')
      return response.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch unread counts')
    }
  }
)

export const markMessagesAsRead = createAsyncThunk(
  'unread/markMessagesAsRead',
  async (chatId, { rejectWithValue }) => {
    try {
      const response = await api.put(`/message/mark-read/${chatId}`)
      return { chatId, ...response.data.data }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark messages as read')
    }
  }
)

const initialState = {
  unreadChatCounts: {}, // { chatId: unreadCount }
  loading: false,
  error: null,
}

const unreadSlice = createSlice({
  name: 'unread',
  initialState,
  reducers: {
    updateUnreadChatCount: (state, action) => {
      const { chatId, count } = action.payload
      if (count === 0 || count === undefined || count === null) {
        delete state.unreadChatCounts[chatId]
      } else {
        state.unreadChatCounts[chatId] = count
      }
    },
    incrementUnreadCount: (state, action) => {
      const { chatId } = action.payload
      state.unreadChatCounts[chatId] = (state.unreadChatCounts[chatId] || 0) + 1
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Unread Chat Counts
      .addCase(fetchUnreadCounts.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchUnreadCounts.fulfilled, (state, action) => {
        state.loading = false
        state.unreadChatCounts = action.payload
      })
      .addCase(fetchUnreadCounts.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      
      // Mark Messages As Read
      .addCase(markMessagesAsRead.fulfilled, (state, action) => {
        const { chatId } = action.payload
        delete state.unreadChatCounts[chatId]
      })
      .addCase(markMessagesAsRead.rejected, (state, action) => {
        state.error = action.payload
      })
  },
})

export const {
  updateUnreadChatCount,
  incrementUnreadCount,
  clearError,
} = unreadSlice.actions

export default unreadSlice.reducer