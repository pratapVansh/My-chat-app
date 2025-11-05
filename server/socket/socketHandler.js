import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const socketHandler = (io) => {
  // Map to track active socket count per user
  const onlineUsersCount = new Map()

  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers.authorization?.split(' ')[1]

      if (!token) {
        return next(new Error('Authentication error: No token provided'))
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      const user = await User.findById(decoded.id).select('-password')

      if (!user) {
        return next(new Error('Authentication error: User not found'))
      }

      socket.userId = user._id.toString()
      socket.user = user
      next()
    } catch (error) {
      next(new Error('Authentication error: Invalid token'))
    }
  })

  io.on('connection', async (socket) => {
    const userId = socket.userId.toString()
    console.log(`User connected: ${socket.user.name} (${userId})`)

    // Increase count for this user's active sockets
    const currentCount = onlineUsersCount.get(userId) || 0
    onlineUsersCount.set(userId, currentCount + 1)

    // If this is the first connection, mark user online
    if (currentCount === 0) {
      await User.findByIdAndUpdate(userId, {
        isOnline: true,
        lastSeen: new Date(),
      })

      // Emit to all clients that this user came online
      io.emit('user online', userId)
    }

    // Emit updated online users list (as pure strings)
    const onlineUserIds = Array.from(onlineUsersCount.keys()).map((id) => id.toString())
    io.emit('online users', onlineUserIds)
    console.log('🌐 All online users:', onlineUserIds)

    // Join user to their personal room
    socket.join(userId)

    // Handle joining a chat
    socket.on('join chat', (chatId) => {
      socket.join(chatId)
      console.log(`User ${socket.user.name} joined chat ${chatId}`)
    })

    // Handle leaving a chat
    socket.on('leave chat', (chatId) => {
      if (!chatId) return console.warn('join chat with no id from', socket.userId)
      socket.leave(chatId)
      console.log(`User ${socket.user.name} left chat ${chatId}`)
    })

    // --- server: inside io.on('connection', (socket) => { ... })

    // Handle typing
    socket.on('typing', (chatId) => {
      try {
        if (!chatId) {
          console.warn('typing event received with no chatId from', socket.userId)
          return
        }

        // Optional safety: only forward if this socket has joined that chat
        if (!socket.rooms.has(chatId)) {
          console.warn(`socket ${socket.userId} attempted typing in room ${chatId} but is not joined`)
          return
        }

        // forward to all other sockets in that chat only
        socket.to(chatId).emit('typing', {
          userId,
          chatId,
          ts: Date.now()
        })
      } catch (err) {
        console.error('Error handling typing:', err)
      }
    })

    // Handle stop typing
    socket.on('stop typing', (chatId) => {
      try {
        if (!chatId) {
          console.warn('stop typing event received with no chatId from', socket.userId)
          return
        }

        if (!socket.rooms.has(chatId)) {
          console.warn(`socket ${socket.userId} attempted stop typing in room ${chatId} but is not joined`)
          return
        }

        socket.to(chatId).emit('stop typing', {
          userId,
          chatId,
          ts: Date.now()
        })
      } catch (err) {
        console.error('Error handling stop typing:', err)
      }
    })


    // Handle new message
    socket.on('new message', (message) => {
      socket.to(message.chat._id).emit('message received', message)
    })



    // Handle message deletion (notify all participants in that chat)
    socket.on('message deleted', (data) => {
      const { chatId, lastMessage } = data
      if (!chatId) return console.warn('⚠️ No chatId provided in message deleted event')
    
      io.to(chatId).emit('message deleted', { chatId, lastMessage })
    })
    

    // Acknowledge message received
    socket.on('message delivered', (messageId) => {
      socket.to(messageId.chat._id).emit('message delivered', messageId)
    })

    // Handle user disconnect
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.user.name} (${userId})`)

      const count = onlineUsersCount.get(userId) || 0

      if (count <= 1) {
        onlineUsersCount.delete(userId)

        await User.findByIdAndUpdate(userId, {
          isOnline: false,
          lastSeen: new Date(),
        })

        // Notify all clients
        io.emit('user offline', userId)
      } else {
        onlineUsersCount.set(userId, count - 1)
      }

      // Always send updated online users list
      const updatedOnlineUserIds = Array.from(onlineUsersCount.keys()).map((id) => id.toString())
      io.emit('online users', updatedOnlineUserIds)
      console.log('🔄 Online users after disconnect:', updatedOnlineUserIds)
    })
  })
}

export { socketHandler }


/*import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const socketHandler = (io) => {
  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1]
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'))
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      const user = await User.findById(decoded.id).select('-password')
      
      if (!user) {
        return next(new Error('Authentication error: User not found'))
      }

      socket.userId = user._id.toString()
      socket.user = user
      next()
    } catch (error) {
      next(new Error('Authentication error: Invalid token'))
    }
  })

  io.on('connection',async (socket) => {
    console.log(`User connected: ${socket.user.name} (${socket.userId})`)

    // Update user online status
    await User.findByIdAndUpdate(socket.userId, {               // check here to solve the problem of online user all time 
      isOnline: true,
      lastSeen: new Date(),
    })

    io.emit('user online', socket.userId)

    // Join user to their personal room
    socket.join(socket.userId)

    // Handle joining a chat
    socket.on('join chat', (chatId) => {
      socket.join(chatId)
      console.log(`User ${socket.user.name} joined chat ${chatId}`)
    })

    // Handle leaving a chat
    socket.on('leave chat', (chatId) => {
      socket.leave(chatId)
      console.log(`User ${socket.user.name} left chat ${chatId}`)
    })

    // Handle typing
    socket.on('typing', (chatId) => {
      socket.to(chatId).emit('typing', {
        userId: socket.userId,
        chatId,
      })
    })

    // Handle stop typing
    socket.on('stop typing', (chatId) => {
      socket.to(chatId).emit('stop typing', {
        userId: socket.userId,
        chatId,
      })
    })

    // Handle new message
    socket.on('new message', (message) => {
      socket.to(message.chat._id).emit('message received', message)
    })

    // Handle user disconnect
    socket.on('disconnect',async () => {
      console.log(`User disconnected: ${socket.user.name} (${socket.userId})`)
      
      // Update user offline status
      await User.findByIdAndUpdate(socket.userId, {
        isOnline: false,
        lastSeen: new Date(),
      })

      // Notify all connected users that this user went offline
      socket.broadcast.emit('user offline', socket.userId)
    })
  })
}

export { socketHandler }*/
