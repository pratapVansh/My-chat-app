import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'
import api from '@/lib/api'

// Async thunks
export const fetchChats = createAsyncThunk(
  'chat/fetchChats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/chat') //axios.get('/api/chat') // remove /api
      return response.data.data.chats  // ← Extract from ApiResponse
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch chats')
    }
  }
)

export const createChat = createAsyncThunk(
  'chat/createChat',
  async (chatData, { rejectWithValue }) => {
    try {
      const response = await api.post('/chat', chatData) //axios.post('/api/chat', chatData)
      return response.data.data //response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create chat')
    }
  }
)

export const createGroupChat = createAsyncThunk(
  'chat/createGroupChat',
  async (groupData, { rejectWithValue }) => {
    try {
      const response = await api.post('/chat/group', groupData) //axios.post('/api/chat/group', groupData)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create group chat')
    }
  }
)

export const updateGroupChat = createAsyncThunk(
  'chat/updateGroupChat',
  async ({ chatId, chatData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/chat/group/${chatId}`, chatData)
      return response.data 
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update group chat')
    }
  }
)

export const deleteChat = createAsyncThunk(
  'chat/deleteChat',
  async (chatId, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/chat/${chatId}`)
      return chatId // returning the deleted chatId
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete chat')
    }
  }
)

// Update group avatar (Cloudinary upload)
export const updateGroupAvatar = createAsyncThunk(
  'chat/updateGroupAvatar',
  async ({ chatId, avatarFile }, { rejectWithValue }) => {
    try {
      const formData = new FormData()
      formData.append('avatar', avatarFile)

      const response = await api.put(`/chat/group/${chatId}/avatar`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      console.log('✅ Group avatar updated:', response.data.data)
      return response.data.data
    } catch (error) {
      console.error('❌ Group avatar upload failed:', error)
      return rejectWithValue(error.response?.data?.message || 'Group avatar upload failed')
    }
  }
)




const initialState = {
  chats: [],
  selectedChat: null,
  loading: false,
  error: null,
  onlineUsers: [],
}

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setSelectedChat: (state, action) => {
      state.selectedChat = action.payload
    },
    clearSelectedChat: (state) => {
      state.selectedChat = null
    },
    updateChatLastMessage: (state, action) => {
      const { chatId, lastMessage } = action.payload
      const chatIndex = state.chats.findIndex(chat => chat._id === chatId)
      if (chatIndex !== -1) {
        state.chats[chatIndex].latestMessage = lastMessage
        // Move chat to top
        const updatedChat = state.chats[chatIndex]
        state.chats.splice(chatIndex, 1)
        state.chats.unshift(updatedChat)
      }
    },
    setOnlineUsers: (state, action) => {
      state.onlineUsers = action.payload
    },
    addOnlineUser: (state, action) => {
      if (!state.onlineUsers.includes(action.payload)) {
        state.onlineUsers.push(action.payload)
      }
    },
    removeOnlineUser: (state, action) => {
      state.onlineUsers = state.onlineUsers.filter(userId => userId !== action.payload)
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Chats
      .addCase(fetchChats.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchChats.fulfilled, (state, action) => {
        state.loading = false
        state.chats = action.payload
      })
      .addCase(fetchChats.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Create Chat
      .addCase(createChat.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createChat.fulfilled, (state, action) => {
        state.loading = false
        if (!Array.isArray(state.chats)) state.chats = [] // 🧱 safety guard
        const existingChat = (state.chats|| []).find(chat => chat._id === action.payload._id)
        if (!existingChat) {
          state.chats.unshift(action.payload)
        }
      })
      .addCase(createChat.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Create Group Chat
      .addCase(createGroupChat.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createGroupChat.fulfilled, (state, action) => {
        state.loading = false
        state.chats.unshift(action.payload)
      })
      .addCase(createGroupChat.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Update Group Chat
      .addCase(updateGroupChat.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateGroupChat.fulfilled, (state, action) => {
        state.loading = false
        const chatIndex = state.chats.findIndex(chat => chat._id === action.payload._id)
        if (chatIndex !== -1) {
          state.chats[chatIndex] = action.payload
        }
        if (state.selectedChat?._id === action.payload._id) {
          state.selectedChat = action.payload
        }
      })
      .addCase(updateGroupChat.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(deleteChat.fulfilled, (state, action) => {
        state.chats = state.chats.filter(chat => chat._id !== action.payload)
        if (state.selectedChat?._id === action.payload) {
          state.selectedChat = null
        }
      })
      // ===== Update Group Avatar =====
      .addCase(updateGroupAvatar.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateGroupAvatar.fulfilled, (state, action) => {
        state.loading = false
        const updatedChat = action.payload
        const chatIndex = state.chats.findIndex(chat => chat._id === updatedChat._id)
        if (chatIndex !== -1) {
          state.chats[chatIndex] = updatedChat
        }
        if (state.selectedChat?._id === updatedChat._id) {
          state.selectedChat = updatedChat
        }
      })
      .addCase(updateGroupAvatar.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

  },
})

export const {
  setSelectedChat,
  clearSelectedChat,
  updateChatLastMessage,
  setOnlineUsers,
  addOnlineUser,
  removeOnlineUser,
  clearError,
} = chatSlice.actions
export default chatSlice.reducer
