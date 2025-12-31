import { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Smile, MoreVertical, Phone, Video,Trash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { setOnlineUsers, addOnlineUser, removeOnlineUser } from '@/store/slices/chatSlice'
import { sendMessage, fetchMessages, addMessage, addTypingUser, removeTypingUser,deleteMessage,deleteAllMessages ,updateMessage ,setMessages} from '@/store/slices/messageSlice'
import { updateChatLastMessage } from '@/store/slices/chatSlice'
import { markMessagesAsRead, updateUnreadChatCount } from '@/store/slices/unreadSlice'
import { formatMessageTime, getSender, isSameUser, isSameSender, isSameSenderMargin } from '@/lib/utils'
import { getSocket } from '@/lib/socket'

import toast from 'react-hot-toast'
import ChatOptionsDropdown from './ChatOptionsDropdown'
import Picker from '@emoji-mart/react'





const ChatBox = () => {
  const [newMessage, setNewMessage] = useState('')
  const [typing, setTyping] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [pendingMessages, setPendingMessages] = useState([]);


  const dispatch = useDispatch()
  const { selectedChat,onlineUsers } = useSelector((state) => state.chat)
  const { messages, loading, typingUsers } = useSelector((state) => state.message)
  const { user } = useSelector((state) => state.auth)

  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const typingChatRef = useRef(null) // current chat for typing timeout
  const emojiPickerRef = useRef(null)


  // New state to track online users by their IDs

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (selectedChat) {
      dispatch(fetchMessages(selectedChat._id))
      // Mark messages as read when user opens a chat
      dispatch(markMessagesAsRead(selectedChat._id))
      dispatch(updateUnreadChatCount({ chatId: selectedChat._id, count: 0 }))
    }
  }, [selectedChat, dispatch])

  useEffect(() => {
    typingChatRef.current = selectedChat?._id ?? null
  }, [selectedChat?._id])
  

  const socket = getSocket()


  // Listen for global user online/offline events to update onlineUsers state
    // 🔹 Listen for global online/offline user updates
    useEffect(() => {
      const socket = getSocket()
      if (!socket) return console.warn('Socket not initialized yet!')
    
      const handleUserOnline = (userId) => {
        console.log('User came online:', userId)
        dispatch(addOnlineUser(userId.toString()))
      }
    
      const handleUserOffline = (userId) => {
        console.log('User went offline:', userId)
        dispatch(removeOnlineUser(userId.toString()))
      }
    
      const handleOnlineUsers = (userIds) => {
        console.log('Received online users:', userIds)
        dispatch(setOnlineUsers(userIds.map((id) => id.toString())))
      }
    
      socket.on('user online', handleUserOnline)
      socket.on('user offline', handleUserOffline)
      socket.on('online users', handleOnlineUsers)
    
      return () => {
        socket.off('user online', handleUserOnline)
        socket.off('user offline', handleUserOffline)
        socket.off('online users', handleOnlineUsers)
      }
    }, [dispatch])
    

    useEffect(() => {
      const socket = getSocket()
      if (!socket || !selectedChat) return
    
      socket.emit('join chat', selectedChat._id)
    
      const handleMessage = (newMessage) => {
        // Add message to the list only if it belongs to the currently open chat
        if (newMessage.chat._id === selectedChat?._id) {
          dispatch(addMessage(newMessage))
          // Mark as read immediately if message is from another user
          if (newMessage.sender._id !== user?._id) {
            dispatch(markMessagesAsRead(selectedChat._id))
            dispatch(updateUnreadChatCount({ chatId: selectedChat._id, count: 0 }))
          }
        }

        // Always update the chat preview for MyChats sidebar
        dispatch(updateChatLastMessage({
          chatId: newMessage.chat._id,
          lastMessage: newMessage
        }))
      }

      // ✅ ADD THIS: Handle deleted messages
      // NEW handler - replace the old handleDeletedMessage
      const handleDeletedMessage = (payload) => {
        // payload coming from server may contain:
        // { chatId, deletedMessageIds, lastMessage, updatedMessage }
        const { chatId, deletedMessageIds = [], lastMessage, updatedMessage } = payload || {}

        // 1) Update chat preview immediately (you already did this)
        if (chatId) {
          dispatch(updateChatLastMessage({ chatId, lastMessage }))
        }

        // 2) If server sent a full updatedMessage object, use your updateMessage reducer
        if (updatedMessage) {
          dispatch(updateMessage({
            updatedMessage,
            currentUserId: user?._id
          }))
          return
        }

        // 3) Otherwise, fallback to deleting messages by id(s) in local state
        if (Array.isArray(deletedMessageIds) && deletedMessageIds.length > 0) {
          // Build new messages array removing any deleted ids
          const updatedMessages = messages.filter(
            (m) => !deletedMessageIds.includes(m._id?.toString())
          )
          dispatch(setMessages(updatedMessages))

          // Also handle edge-case: if lastMessage is null and messages is now empty,
          // update chat preview already handled above.
        }
      }

      
    
     /* const handleTyping = (e) => {
        setNewMessage(e.target.value)
      
        const socket = getSocket()
        if (!socket) {
          console.warn('Socket not initialized yet!')
          return
        }
      
        // Guard: must have a selected chat id
        const chatId = typingChatRef.current
        if (!chatId) {
          console.warn('Attempted to emit typing but no selectedChat._id')
          return
        }
      
        if (!typing) {
          setTyping(true)
          socket.emit('typing', chatId)
          console.debug('emit typing', { chatId })
        }
      
        clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = setTimeout(() => {
          socket.emit('stop typing', chatId)
          setTyping(false)
          console.debug('emit stop typing', { chatId })
        }, 3000)
      }*/

      const handleStopTyping = (data) => {
        if (data.chatId === selectedChat?._id && data.userId !== user?._id) {
          dispatch(removeTypingUser(data))
        }
      }
      const handleTypingEvent = (data) => {
        if (data.chatId === selectedChat?._id && data.userId !== user?._id) {
          dispatch(addTypingUser(data))
        }
      }
    
      socket.on('message received', handleMessage)
      socket.on('message deleted', handleDeletedMessage)
      socket.on('typing', handleTypingEvent)
      socket.on('stop typing', handleStopTyping)

      return () => {
        if (selectedChat?._id) {
          socket.emit('leave chat', selectedChat._id)
        }
        socket.off('message received', handleMessage)
        socket.off('message deleted', handleDeletedMessage)
        socket.off('typing', handleTypingEvent)
        socket.off('stop typing', handleStopTyping)
      }
  }, [selectedChat, dispatch, user, messages])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target)
      ) {
        setShowEmojiPicker(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat?._id) return;
  
    const tempId = `pending-${Date.now()}`;
    const optimisticMessage = {
      _id: tempId,
      content: newMessage,
      chat: selectedChat,
      sender: user,
      createdAt: new Date().toISOString(),
      isPending: true,
    };
  
    setPendingMessages((prev) => [...prev, optimisticMessage]);
    setNewMessage('');
    setTyping(false);
    getSocket().emit('stop typing', selectedChat._id);

    dispatch(
      updateChatLastMessage({
        chatId: selectedChat._id,
        lastMessage: {
          _id: tempId,
          content: newMessage,
          sender: user,
          createdAt: optimisticMessage.createdAt,
          isPending: true,
        },
      })
    );
  
    try {
      const resultAction = await dispatch(sendMessage({
        content: optimisticMessage.content,
        chatId: selectedChat._id
      }));
  
      if (sendMessage.fulfilled.match(resultAction)) {
        const savedMessage = resultAction.payload;
        setPendingMessages((prev) => prev.filter(m => m._id !== tempId));
        // Message will appear via Redux when confirmed

        getSocket().emit('new message', savedMessage);

      } else {
        setPendingMessages((prev) => prev.filter(m => m._id !== tempId));
        setNewMessage(optimisticMessage.content);
        toast.error('Failed to send message');
      }
    } catch {
      setPendingMessages((prev) => prev.filter(m => m._id !== tempId));
      setNewMessage(optimisticMessage.content);
      toast.error('An unexpected error occurred');
    }
  };
  
  

  const handleDeleteMessage = async (messageId) => {
    try {
      const resultAction = await dispatch(deleteMessage(messageId))
  
      if (deleteMessage.fulfilled.match(resultAction)) {
        toast.success('Message deleted successfully')
  
        // ✅ 1. Compute updated messages after deletion
        const updatedMessages = messages.filter(msg => msg._id !== messageId)
        const lastMsg = updatedMessages[updatedMessages.length - 1] || null
  
        // ✅ 2. Immediately update MyChats’ last message in Redux
        dispatch(
          updateChatLastMessage({
            chatId: selectedChat._id,
            lastMessage: lastMsg
              ? {
                  _id: lastMsg._id,
                  content: lastMsg.content,
                  sender: lastMsg.sender,
                  createdAt: lastMsg.createdAt,
                }
              : null,
          })
        )
  
        // ✅ 3. Emit socket event to notify all users in this chat
        const socket = getSocket()
        socket.emit('message deleted', {
            chatId: selectedChat._id,
            lastMessage: lastMsg
              ? {
                  _id: lastMsg._id,
                  content: lastMsg.content,
                  sender: lastMsg.sender,
                  createdAt: lastMsg.createdAt,
                }
              : null,
          })
        } else {
          toast.error('Failed to delete message')
        }
      } catch (error) {
        console.error('Error deleting message:', error)
        toast.error('An unexpected error occurred')
      }
    }
  
  

  const handleTyping = (e) => {
    setNewMessage(e.target.value)
  
    const socket = getSocket()
    if (!socket) {
      console.warn('Socket not initialized yet!')
      return
    }
  
    if (!typing) {
      setTyping(true)
      socket.emit('typing', selectedChat._id)
    }
  
    clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop typing', selectedChat._id)
      setTyping(false)
    }, 3000)
  }
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleEmojiSelect = (emoji) => {
    setNewMessage((prev) => prev + emoji.native) // emoji.native has the actual emoji character
  }
  

  if (!selectedChat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center space-y-5 px-8">
          <div className="w-20 h-20 mx-auto bg-secondary/50 rounded-full flex items-center justify-center">
            <span className="text-4xl">💬</span>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-1">Select a conversation</h3>
            <p className="text-sm text-muted-foreground">Choose a chat from the sidebar to start messaging</p>
          </div>
        </div>
      </div>
    )
  }

  // Determine online status of the other user in 1:1 chat  
  const otherUser = selectedChat.isGroupChat ? null : getSender(user, selectedChat.users) 
  const otherUserId = otherUser?._id?.toString() || ''
  const isOtherUserOnline = otherUserId ? onlineUsers.includes(otherUserId) : false


  return (
    <div className="flex flex-col h-full bg-background">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b bg-card">
        <div className="flex items-center gap-3">
          <Avatar className="h-11 w-11 ring-2 ring-background shadow-sm">
            <AvatarImage 
              src={
                selectedChat.isGroupChat
                  ? selectedChat.groupAvatar
                  : otherUser?.avatar
              } 
              alt="Avatar" 
            />
            <AvatarFallback className="text-sm font-medium">
              {selectedChat.isGroupChat
                ? selectedChat.chatName.charAt(0).toUpperCase()
                : otherUser?.name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-[15px] font-semibold leading-tight">
              {selectedChat.isGroupChat
                ? selectedChat.chatName
                : otherUser?.name}
            </h3>
            <p className="text-[13px] text-muted-foreground leading-tight mt-0.5">
              {selectedChat.isGroupChat
                ? `${selectedChat.users.length} members`
                : typingUsers?.some(
                  (t) => t.userId === otherUser?._id && t.chatId === selectedChat?._id
                )
                ? 'typing...'
                : isOtherUserOnline
                  ? 'online'
                  : 'offline'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
            {/* Modern dropdown */}
            <ChatOptionsDropdown selectedChat={selectedChat} />
        </div>
      </div>

      {/* Messages */}
      {/* ✅ Scrollable message area */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-1 bg-background">
       {(!messages || messages.length === 0) && loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary/30 border-t-primary"></div>
          </div>
        ) : !messages || messages.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <p className="text-sm text-muted-foreground">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <AnimatePresence>
            {[...messages, ...pendingMessages].map((message, index) => (
              <motion.div
                key={message._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className={`flex ${message.sender._id === user._id ? 'justify-end' : 'justify-start'}`}
                style={{
                  marginTop: isSameSender(messages, message, index, user._id) ? '2px' : '12px',
                }}
              >
                <div className={`flex max-w-[65%] ${message.sender._id === user._id ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
                  {!isSameUser(messages, message, index) && (
                    <Avatar className={`h-7 w-7 ring-1 ring-border/30`}>
                      <AvatarImage src={message.sender.avatar} alt={message.sender.name} />
                      <AvatarFallback className="text-[11px]">
                        {message.sender.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`relative group ${
                      isSameUser(messages, message, index)
                        ? message.sender._id === user._id
                          ? 'mr-9'
                          : 'ml-9'
                        : ''
                    }`}
                  >
                    <div className={`px-3.5 py-2 rounded-2xl shadow-sm ${
                      message.sender._id === user._id
                        ? 'bg-primary text-white rounded-br-md'
                        : 'bg-card border border-border/50 rounded-bl-md'
                    }`}>
                      {/* Show deleted message indicator */}
                      {message.isDeleted || message.deletedForAll ? (
                        <p className="text-[14px] break-words italic opacity-60 leading-relaxed">
                          This message was deleted
                        </p>
                      ) : (
                        <>
                          <p className="text-[14px] break-words leading-relaxed">{message.content}</p>
                          {message.isPending && (
                            <span className="text-[11px] opacity-60 ml-2">Sending...</span>
                          )}
                        </>
                      )}
                      <p
                        className={`text-[11px] mt-1 ${
                          message.sender._id === user._id
                            ? 'text-white/60'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {formatMessageTime(message.createdAt)}
                      </p>
                    </div>

                   {/* Hide delete button for deleted messages */}
                   {!(message.isDeleted || message.deletedForAll) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute -top-1 -right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-destructive/10 hover:text-destructive shadow-sm"
                        onClick={() => handleDeleteMessage(message._id)}
                      >
                        <Trash className="h-3 w-3" />
                      </Button>
                    )}
                  </div>

                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {/* Typing Indicator */}
        {typingUsers.some(t => t.chatId === selectedChat?._id && t.userId !== user?._id) && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 ml-9 mt-3"
          >
            <div className="flex gap-1 px-3 py-2 bg-card border border-border/50 rounded-2xl rounded-bl-md">
              <div className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1s' }}></div>
              <div className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '150ms', animationDuration: '1s' }}></div>
              <div className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '300ms', animationDuration: '1s' }}></div>
            </div>
          </motion.div>
        )}


        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="px-5 py-4 border-t bg-card relative">
        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div ref={emojiPickerRef} className="absolute bottom-20 left-5 z-50 emoji-picker-container shadow-2xl">
            <Picker onEmojiSelect={handleEmojiSelect} />
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Emoji Toggle Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10 hover:bg-accent/50 transition-colors"
            onClick={() => setShowEmojiPicker((prev) => !prev)}
          >
            <Smile className="h-5 w-5" />
          </Button>

          {/* Message Input */}
          <Input
            value={newMessage}
            onChange={handleTyping}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 h-11 bg-secondary/50 border-transparent hover:bg-secondary focus:bg-background transition-colors"
          />

          {/* Send Button */}
          <Button 
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            size="icon"
            className="h-10 w-10 rounded-full shadow-sm transition-all disabled:opacity-40"
          >
            <Send className="h-[18px] w-[18px]" />
          </Button>
        </div>
      </div>

    </div>
  )
}

export default ChatBox
