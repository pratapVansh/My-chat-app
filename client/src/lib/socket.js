import { io } from 'socket.io-client'
import { setOnlineUsers, addOnlineUser, removeOnlineUser, updateChatLastMessage } from '../store/slices/chatSlice.js'
import { updateUnreadChatCount, incrementUnreadCount } from '../store/slices/unreadSlice.js'

let socket = null
let storeRef = null 

export const initializeSocket = async (user, store) => {
  if (socket) {
    socket.disconnect()
  }

  const token = localStorage.getItem('accessToken')

  socket = io(import.meta.env.VITE_BACKEND_API, {
    auth: { token },
    transports: ['websocket'],
    extraHeaders: { Authorization: `Bearer ${token}` },
  })

  // ✅ store reference saved globally
  storeRef = store

  socket.on('connect', () => {
    console.log('🟢 Connected to server')
  })

  socket.on('disconnect', (reason) => {
    console.log(`🔴 Disconnected from server: ${reason}`)
  })

  socket.on('connect_error', (error) => {
    console.error('Connection error:', error.message)
  })

  socket.on('online users', (userIds) => {
    console.log('🟣 Received online users from server:', userIds)
    if (storeRef && Array.isArray(userIds)) {
      storeRef.dispatch(setOnlineUsers(userIds.map((id) => id.toString())))
    } else {
      console.warn('⚠️ Store not available yet when receiving online users.')
    }
  })

  socket.on('user online', (userId) => {
    console.log('🟢 User came online:', userId)
    if (storeRef && userId != null) storeRef.dispatch(addOnlineUser(userId.toString()))
  })

  socket.on('user offline', (userId) => {
    console.log('🔴 User went offline:', userId)
    if (storeRef && userId != null) storeRef.dispatch(removeOnlineUser(userId.toString()))
  })

  socket.on('unread count updated', (payload = {}) => {
    try {
      if (!storeRef) return

  const { chatId, senderId } = payload
  if (!chatId) return

  const normalizedChatId = chatId.toString()

      const state = storeRef.getState()
      const currentUserId = state?.auth?.user?._id?.toString()
      const activeChatId = state?.chat?.selectedChat?._id
        ? state.chat.selectedChat._id.toString()
        : null

      // Ignore events triggered by the current user
      if (senderId && senderId.toString() === currentUserId) {
        return
      }

      if (normalizedChatId === activeChatId) {
        storeRef.dispatch(updateUnreadChatCount({ chatId: normalizedChatId, count: 0 }))
      } else {
        storeRef.dispatch(incrementUnreadCount({ chatId: normalizedChatId }))
      }
    } catch (err) {
      console.error('Error handling unread count update:', err)
    }
  })

  socket.on('chat updated', (payload = {}) => {
    try {
      if (!storeRef) return

      const { chatId, lastMessage } = payload
      if (!chatId) return

      storeRef.dispatch(
        updateChatLastMessage({
          chatId: chatId.toString(),
          lastMessage,
        })
      )
    } catch (err) {
      console.error('Error handling chat preview update:', err)
    }
  })

  return socket
}

export const getSocket = () => socket

export const disconnectSocket = () => {
  try {
    if (socket) {
      console.log('🔴 Disconnecting socket...')
      socket.removeAllListeners()  // Remove all event listeners
      socket.disconnect()           // Close the connection
      socket = null                 // Clear socket instance
    }

    if (storeRef) {
      storeRef = null               // Remove Redux reference
    }

    console.log('🧹 Socket fully cleaned up')
  } catch (error) {
    console.error('Error during socket disconnect:', error)
  }
}























































/*import { io } from 'socket.io-client'
import { setOnlineUsers, addOnlineUser, removeOnlineUser } from '../store/slices/chatSlice.js'

let socket = null


export const initializeSocket =async (user) => {
  if (socket) {
    socket.disconnect()
  }
  
  const token = localStorage.getItem('accessToken')
  
  socket = io('http://localhost:5000', {
    auth: {
      token: token,
    },
    transports: ['websocket'],
    extraHeaders: {
      Authorization: `Bearer ${token}`
    }
  })

    // 🧠 dynamically import the store *after* initialization, breaking the circular import
    const { default: store } = await import('../store/store.js')

  socket.on('connect', () => {
    console.log('Connected to server')
  })

  socket.on('disconnect', (reason) => {
    console.log(`Disconnected from server: ${reason}`)
  })

  socket.on('connect_error', (error) => {
    console.error('Connection error:', error.message)
  })
  // Dispatch directly to the Redux store from here:
  socket.on('online users', (userIds) => {
    console.log(' Received online users from server:', userIds)
    if (Array.isArray(userIds)) {
      store.dispatch(setOnlineUsers(userIds.map((id) => id.toString())))
    }
  })

  socket.on('user online', (userId) => {
    console.log(' User came online:', userId)
    if (userId != null) store.dispatch(addOnlineUser(userId.toString()))
  })

  socket.on('user offline', (userId) => {
    console.log('User went offline:', userId)
    if (userId != null) store.dispatch(removeOnlineUser(userId.toString()))
  })

  return socket
}

export const getSocket = () => socket

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

// Export socket for direct use
export { socket }


*/
















/*import { io } from 'socket.io-client'

let socket = null

export const initializeSocket = (user) => {
  if (socket) {
    socket.disconnect()
  }
  
  const token = localStorage.getItem('accessToken')
  
  socket = io('http://localhost:5000', {
    auth: {
      token: token,
    },
    extraHeaders: {
      Authorization: `Bearer ${token}`
    }
  })

  socket.on('connect', () => {
    console.log('Connected to server')
  })

  socket.on('disconnect', () => {
    console.log('Disconnected from server')
  })

  return socket
}

export const getSocket = () => socket

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

// Export socket for direct use
export { socket }*/

