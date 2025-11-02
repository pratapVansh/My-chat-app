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
      // Return the updated message object from the backend
      return response.data.data // This contains the updated message
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
    updateMessage: (state, action) => {
      const { updatedMessage, currentUserId } = action.payload
      const index = state.messages.findIndex(msg => msg._id === updatedMessage._id)
      
      if (index !== -1) {
        // If receiver deleted it for themselves, remove from their view
        const isDeletedForUser = updatedMessage.deletedFor?.some(
          (userId) => userId.toString() === currentUserId?.toString()
        ) && !updatedMessage.deletedForAll
        
        if (isDeletedForUser) {
          // Receiver deleted: remove from their view
          state.messages = state.messages.filter(msg => msg._id !== updatedMessage._id)
        } else {
          // Update the message (sender deleted or message visible)
          state.messages[index] = updatedMessage
        }
      }
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
        const updatedMessage = action.payload
        const index = state.messages.findIndex(msg => msg._id === updatedMessage._id)
        
        if (index !== -1) {
          // Get current user from localStorage since it's not in messageSlice state
          const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
          const currentUserId = storedUser?._id?.toString()
          
          const isDeletedForUser = updatedMessage.deletedFor?.some(
            (userId) => userId.toString() === currentUserId
          ) && !updatedMessage.deletedForAll
          
          if (isDeletedForUser) {
            // Receiver deleted: remove from their view
            state.messages = state.messages.filter(msg => msg._id !== updatedMessage._id)
          } else {
            // Sender deleted or message is still visible: update the message
            state.messages[index] = updatedMessage
          }
        }
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
  updateMessage, 
  clearMessages,
  setTypingUsers,
  addTypingUser,
  removeTypingUser,
  clearError,
} = messageSlice.actions
export default messageSlice.reducer
