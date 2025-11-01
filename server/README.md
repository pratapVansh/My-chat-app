# Chat App - Backend

Node.js backend for the MERN Chat App with real-time messaging capabilities using Socket.io.

## 🚀 Features

- **RESTful API** with Express.js
- **Real-time messaging** with Socket.io
- **JWT Authentication** with secure token handling
- **MongoDB integration** with Mongoose
- **Password hashing** with bcrypt
- **Error handling** with custom middleware
- **Input validation** and sanitization
- **CORS support** for cross-origin requests
- **Async/await** error handling

## 🛠️ Tech Stack

- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Socket.io** for real-time communication
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Express Async Handler** for async error handling
- **CORS & Cookie Parser** middleware

## 📁 Project Structure

```
server/
├── controllers/          # Route controllers
├── middleware/          # Custom middleware
│   ├── authMiddleware.js
│   └── errorMiddleware.js
├── models/              # Mongoose models
│   ├── User.js
│   ├── Chat.js
│   └── Message.js
├── routes/              # API routes
│   ├── authRoutes.js
│   ├── chatRoutes.js
│   └── messageRoutes.js
├── socket/              # Socket.io handlers
│   └── socketHandler.js
├── utils/               # Utility functions
│   ├── ApiError.js
│   ├── ApiResponse.js
│   ├── asyncHandler.js
│   └── generateToken.js
├── config/              # Configuration files
│   └── db.js
├── server.js            # Main server file
└── package.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   
   Create a `.env` file in the server directory:
   ```env
   NODE_ENV=development
   PORT=5000
   CLIENT_URL=http://localhost:3000
   
   # MongoDB
   MONGODB_URI=mongodb://localhost:27017/chatapp
   
   # JWT
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRE=7d
   ```

3. **Start the server**
   
   **Development:**
   ```bash
   npm run dev
   ```
   
   **Production:**
   ```bash
   npm start
   ```

4. **Access the API**
   - Server: http://localhost:5000
   - Health check: http://localhost:5000/api/health

## 🔧 Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon

## 🌐 API Endpoints

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Register new user | No |
| POST | `/login` | Login user | No |
| POST | `/logout` | Logout user | Yes |
| GET | `/me` | Get current user | Yes |
| GET | `/search` | Search users | Yes |

### Chat Routes (`/api/chat`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Fetch user's chats | Yes |
| POST | `/` | Create/fetch one-to-one chat | Yes |
| POST | `/group` | Create group chat | Yes |
| PUT | `/group/:chatId` | Update group chat | Yes |
| DELETE | `/group/:chatId` | Delete group chat | Yes |

### Message Routes (`/api/message`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/:chatId` | Fetch messages for a chat | Yes |
| POST | `/` | Send a message | Yes |
| PUT | `/:messageId/edit` | Edit a message | Yes |
| DELETE | `/:messageId` | Delete a message | Yes |

## 🔒 Authentication

### JWT Token Flow
1. User registers/logs in
2. Server generates JWT token
3. Token sent to client
4. Client includes token in Authorization header
5. Server validates token on protected routes

### Protected Routes
All chat and message routes require authentication. Use the `protect` middleware.

## 🗄️ Database Models

### User Model
```javascript
{
  name: String (required),
  email: String (required, unique),
  password: String (required),
  avatar: String,
  isOnline: Boolean,
  lastSeen: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Chat Model
```javascript
{
  chatName: String,
  isGroupChat: Boolean,
  users: [ObjectId],
  latestMessage: ObjectId,
  groupAdmin: ObjectId,
  groupAvatar: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Message Model
```javascript
{
  sender: ObjectId (required),
  content: String (required),
  chat: ObjectId (required),
  readBy: [{
    user: ObjectId,
    readAt: Date
  }],
  isEdited: Boolean,
  editedAt: Date,
  replyTo: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

## 🔌 Socket.io Events

### Client to Server
- `join chat` - Join a chat room
- `leave chat` - Leave a chat room
- `typing` - User is typing
- `stop typing` - User stopped typing
- `new message` - Send new message

### Server to Client
- `message received` - New message received
- `typing` - Someone is typing
- `stop typing` - Someone stopped typing
- `user offline` - User went offline

## 🛡️ Security Features

- **Password hashing** with bcrypt
- **JWT token authentication**
- **Input validation** and sanitization
- **CORS protection**
- **Rate limiting** (can be added)
- **Helmet** for security headers (can be added)

## 🚨 Error Handling

### Custom Error Classes
- `ApiError` - Custom error class with status codes
- `ApiResponse` - Standardized response format

### Error Middleware
- Global error handler
- 404 handler for unknown routes
- Mongoose error handling
- JWT error handling

## 🧪 Testing

### Manual Testing
1. Test all API endpoints with Postman/Insomnia
2. Test Socket.io events
3. Test authentication flow
4. Test error scenarios

### Automated Testing (Can be added)
- Unit tests with Jest
- Integration tests
- Socket.io testing

## 🚀 Deployment

### Environment Variables
Ensure all required environment variables are set:
- `NODE_ENV`
- `PORT`
- `MONGODB_URI`
- `JWT_SECRET`
- `CLIENT_URL`

### Production Considerations
- Use environment-specific MongoDB
- Set strong JWT secret
- Enable HTTPS
- Add rate limiting
- Add logging
- Add monitoring

### Deploy to Railway/Heroku
1. Connect your repository
2. Set environment variables
3. Deploy!

## 🔧 Customization

### Adding New Routes
1. Create controller function
2. Add route in appropriate router
3. Add middleware if needed
4. Update API documentation

### Adding Socket Events
1. Add event handler in `socketHandler.js`
2. Update client-side socket code
3. Test the new functionality

### Database Changes
1. Update model schemas
2. Create migration scripts if needed
3. Update API responses
4. Test thoroughly

## 📊 Monitoring & Logging

### Current Logging
- Console logs for connections
- Error logging in middleware
- Database connection status

### Can be Enhanced With
- Winston for structured logging
- Morgan for HTTP request logging
- Performance monitoring
- Error tracking (Sentry)

## 🤝 Contributing

1. Follow the existing code structure
2. Add proper error handling
3. Include input validation
4. Update documentation
5. Test thoroughly

---

**Happy Coding! 🚀**
