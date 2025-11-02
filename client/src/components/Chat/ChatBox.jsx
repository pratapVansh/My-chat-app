import { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Smile, MoreVertical, Phone, Video,Trash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { setOnlineUsers, addOnlineUser, removeOnlineUser } from '@/store/slices/chatSlice'
import { sendMessage, fetchMessages, addMessage, addTypingUser, removeTypingUser,deleteMessage,deleteAllMessages ,updateMessage } from '@/store/slices/messageSlice'
import { updateChatLastMessage } from '@/store/slices/chatSlice'
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
    }
  }, [selectedChat, dispatch])

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
        dispatch(addMessage(newMessage))
        dispatch(updateChatLastMessage({
          chatId: newMessage.chat._id,
          lastMessage: newMessage
        }))
      }
    
      // ✅ ADD THIS: Handle deleted messages
      const handleDeletedMessage = ({ chatId, lastMessage }) => {
        // Update the chat sidebar immediately for everyone
        dispatch(updateChatLastMessage({ chatId, lastMessage }))
      }
      
    
      const handleTyping = (data) => {
        if (data.chatId === selectedChat?._id && data.userId !== user?._id) {
          dispatch(addTypingUser(data))
        }
      }
    
      const handleStopTyping = (data) => {
        if (data.chatId === selectedChat?._id && data.userId !== user?._id) {
          dispatch(removeTypingUser(data))
        }
      }
    
      socket.on('message received', handleMessage)
      socket.on('message deleted', handleDeletedMessage) // ✅ ADD THIS
      socket.on('typing', handleTyping)
      socket.on('stop typing', handleStopTyping)
    
      return () => {
        socket.emit('leave chat', selectedChat._id)
        socket.off('message received', handleMessage)
        socket.off('message deleted', handleDeletedMessage) // ✅ ADD THIS
        socket.off('typing', handleTyping)
        socket.off('stop typing', handleStopTyping)
      }
    }, [selectedChat, dispatch, user])

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
      <div className="flex-1 flex items-center justify-center bg-muted/50">
        <div className="text-center space-y-4">
          <div className="w-24 h-24 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
            <span className="text-4xl">💬</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-muted-foreground">Select a chat</h3>
            <p className="text-sm text-muted-foreground">Choose a conversation to start messaging</p>
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
    <div className="flex-1 flex flex-col bg-background">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage 
              src={
                selectedChat.isGroupChat
                  ? selectedChat.groupAvatar
                  : otherUser?.avatar
              } 
              alt="Avatar" 
            />
            <AvatarFallback>
              {selectedChat.isGroupChat
                ? selectedChat.chatName.charAt(0).toUpperCase()
                : otherUser?.name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">
              {selectedChat.isGroupChat
                ? selectedChat.chatName
                : otherUser?.name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {selectedChat.isGroupChat
                ? `${selectedChat.users.length} members`
                : typingUsers.some(t => t.userId === otherUser?._id)
                  ? 'typing...'
                  : isOtherUserOnline
                    ? 'online'
                    : 'offline'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon">
            <Phone className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Video className="h-4 w-4" />
          </Button>
            {/* Modern dropdown */}
            <ChatOptionsDropdown selectedChat={selectedChat} />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {(!messages || messages.length === 0) && loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : !messages || messages.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <AnimatePresence>
            {[...messages, ...pendingMessages].map((message, index) => (
              <motion.div
                key={message._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className={`flex ${message.sender._id === user._id ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex max-w-[70%] ${message.sender._id === user._id ? 'flex-row-reverse' : 'flex-row'}`}>
                  {!isSameUser(messages, message, index) && (
                    <Avatar className={`h-8 w-8 ${message.sender._id === user._id ? 'ml-2' : 'mr-2'}`}>
                      <AvatarImage src={message.sender.avatar} alt={message.sender.name} />
                      <AvatarFallback>
                        {message.sender.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`relative px-4 py-2 rounded-2xl ${
                      message.sender._id === user._id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    } ${
                      isSameUser(messages, message, index)
                        ? message.sender._id === user._id
                          ? 'mr-14'
                          : 'ml-14'
                        : ''
                    }`}
                    style={{
                      marginTop: isSameSender(messages, message, index, user._id) ? 3 : 10,
                      marginLeft: isSameSenderMargin(messages, message, index, user._id),
                    }}
                  >
                    {/* Show deleted message indicator */}
                    {message.isDeleted || message.deletedForAll ? (
                      <p className="text-sm break-words italic text-muted-foreground">
                        This message was deleted
                      </p>
                    ) : (
                      <>
                        <p className="text-sm break-words">{message.content}</p>
                        {message.isPending && (
                          <span className="text-xs text-muted-foreground ml-2">Sending...</span>
                        )}
                      </>
                    )}
                    <p
                      className={`text-xs mt-1 ${
                        message.sender._id === user._id
                          ? 'text-primary-foreground/70'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {formatMessageTime(message.createdAt)}
                    </p>


                   {/* Hide delete button for deleted messages */}
                   {!(message.isDeleted || message.deletedForAll) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6"
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
        {typingUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center space-x-2 text-muted-foreground"
          >
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <span className="text-sm">Someone is typing...</span>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t bg-card relative">
        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div ref={emojiPickerRef} className="absolute bottom-16 left-4 z-50 emoji-picker-container">
            <Picker onEmojiSelect={handleEmojiSelect} />
          </div>
        )}

        <div className="flex items-center space-x-2">
          {/* Emoji Toggle Button */}
          <Button 
            variant="ghost" 
            size="icon" 
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
            className="flex-1"
          />

          {/* Send Button */}
          <Button 
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

    </div>
  )
}

export default ChatBox
