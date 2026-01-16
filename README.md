# Chat App

Real-time chat application with user authentication, group chats, and message notifications.

## Tech Stack
- **Frontend:** React + Vite + TailwindCSS + Zustand
- **Backend:** Node.js + Express + MongoDB
- **Real-time:** Socket.io
- **Storage:** Cloudinary
- **Email:** Nodemailer

## Features
✅ User authentication (Register/Login/Forgot Password)  
✅ One-to-one chat  
✅ Group chat with admin controls  
✅ Real-time messaging with Socket.io  
✅ Typing indicators  
✅ Unread message counts & badges  
✅ Avatar upload via Cloudinary  
✅ Dark/Light mode  
✅ Password reset via email  
✅ Protected routes  

## Project Structure

```
Chat app/
├── client/          # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── store/   # Zustand state management
│   │   └── contexts/
│   └── .env
└── server/          # Express backend
    ├── controllers/
    ├── models/
    ├── routes/
    ├── middleware/
    └── .env
```

## Setup Instructions

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Cloudinary account
- Gmail account (for email)



## Deployment

- **Frontend:** Vercel
- **Backend:** Render
- **Database:** MongoDB Atlas

## Future Enhancements
- [ ] CI/CD Pipeline (GitHub Actions)
- [ ] Docker containerization
- [ ] Message reactions
- [ ] File/image sharing in chat
- [ ] Voice messages
- [ ] Read receipts
