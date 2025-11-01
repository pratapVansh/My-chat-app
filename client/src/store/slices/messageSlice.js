import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'
import api from '@/lib/api'

// Async thunks
export const sendMessage = createAsyncThunk(
  'message/sendMessage',
  async (messageData, { rejectWithValue }) => {
    try {
      console.log('messageData', messageData) //debug log for messageData
      const response = await api.post('/message', messageData)  //axios.post('/api/message', messageData)
      return response.data.data 
    } catch (error) {
      console.log('error', error) //debug log for error
      return rejectWithValue(error.response?.data?.message || 'Failed to send message')
    }
  }
)

export const fetchMessages = createAsyncThunk(
  'message/fetchMessages',
  async (chatId, { rejectWithValue }) => {
    try {
      console.log("chatId",chatId)
      const response = await api.get(`/message/${chatId}`) //remove /api
      return response.data.data.messages
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch messages')
    }
  }
)

export const deleteMessage = createAsyncThunk(
  'message/deleteMessage',
  async (messageId, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/message/${messageId}`)
      return messageId // return the deleted messageId to remove from state
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete message')
    }
  }
)

export const deleteAllMessages = createAsyncThunk(
  'messages/deleteAllMessages',
  async (chatId, { rejectWithValue }) => {
    try {
      await api.delete(`/message/chat/${chatId}`)
      return chatId
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete all messages')
    }
  }
)



const initialState = {
  messages: [],
  loading: false,
  error: null,
  typingUsers: [],
}

const messageSlice = createSlice({
  name: 'message',
  initialState,
  reducers: {
    addMessage: (state, action) => {
      const message = action.payload
      const existingMessage = state.messages.find(m => m._id === message._id)
      if (!existingMessage) {
        state.messages.push(message)
      }
    },
    setMessages: (state, action) => {
      state.messages = action.payload
    },
    clearMessages: (state) => {
      state.messages = []
    },
    setTypingUsers: (state, action) => {
      state.typingUsers = action.payload
    },
    addTypingUser: (state, action) => {
      const { userId, chatId } = action.payload
      const existingTyping = state.typingUsers.find(t => t.userId === userId && t.chatId === chatId)
      if (!existingTyping) {
        state.typingUsers.push({ userId, chatId })
      }
    },
    removeTypingUser: (state, action) => {
      const { userId, chatId } = action.payload
      state.typingUsers = state.typingUsers.filter(
        t => !(t.userId === userId && t.chatId === chatId)
      )
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Send Message
      .addCase(sendMessage.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        console.log('fetchMessages fulfilled payload:', action.payload) // ← Debug log
        state.loading = false
        const message = action.payload
        const existingMessage = state.messages.find(m => m._id === message._id)
        if (!existingMessage) {
          state.messages.push(message)
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Fetch Messages
      .addCase(fetchMessages.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        console.log('fetchMessages fulfilled payload:', action.payload) // ← Debug log
        state.loading = false
        state.messages = action.payload // state.messages = action.payload.messages
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(deleteMessage.fulfilled, (state, action) => {
        state.messages = state.messages.filter(msg => msg._id !== action.payload)
      })
      .addCase(deleteMessage.rejected, (state, action) => {
        state.error = action.payload
      })
      .addCase(deleteAllMessages.fulfilled, (state, action) => {
        const chatId = action.payload
        // Remove messages belonging to the deleted chat
        state.messages = state.messages.filter(msg => msg.chat?._id !== chatId)
        
        // Clear messages in the selected chat window if it's the same chat
        if (state.selectedChat?._id === chatId) {
          state.selectedChatMessages = []
        }
      })
      
      

  },
})

export const {
  addMessage,
  setMessages,
  clearMessages,
  setTypingUsers,
  addTypingUser,
  removeTypingUser,
  clearError,
} = messageSlice.actions
export default messageSlice.reducer
