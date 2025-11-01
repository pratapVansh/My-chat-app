import dotenv from 'dotenv'
dotenv.config({ path: './.env' })

import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { createServer } from 'http'
import { Server } from 'socket.io'
import path from 'path'

import connectDB from './config/db.js'
import authRoutes from './routes/authRoutes.js'
import chatRoutes from './routes/chatRoutes.js'
import messageRoutes from './routes/messageRoutes.js'
import { notFound, errorHandler } from './middleware/errorMiddleware.js'
import { socketHandler } from './socket/socketHandler.js'

// -------------------- CONNECT TO DATABASE --------------------
connectDB()

const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
})

// -------------------- MIDDLEWARE --------------------
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}))
app.use(express.json())
app.use(cookieParser())

// -------------------- STATIC FILES (Avatars) --------------------

                                 

import { fileURLToPath } from 'url'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

app.use('/avatars', express.static(path.join(__dirname, 'public/avatars')))

// -------------------- ROUTES --------------------
app.use('/api/auth', authRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/message', messageRoutes)

// -------------------- HEALTH CHECK --------------------
app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running!' })
})

// -------------------- ERROR HANDLERS --------------------
app.use(notFound)
app.use(errorHandler)

// -------------------- SOCKET.IO --------------------
socketHandler(io)

// -------------------- START SERVER --------------------
const PORT = process.env.PORT || 5000

server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`)
})
