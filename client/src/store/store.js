import { configureStore } from '@reduxjs/toolkit'
import authSlice from './slices/authSlice'
import chatSlice from './slices/chatSlice'
import messageSlice from './slices/messageSlice'
import unreadSlice from './slices/unreadSlice'

export const store = configureStore({
  reducer: {
    auth: authSlice,
    chat: chatSlice,
    message: messageSlice,
    unread: unreadSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
})
