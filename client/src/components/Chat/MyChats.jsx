import { useState, useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Plus, Users, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import UnreadBadge from '@/components/ui/UnreadBadge'
import { fetchChats, setSelectedChat, createChat, createGroupChat } from '@/store/slices/chatSlice'
import { searchUsers, clearSearchResults } from '@/store/slices/authSlice'
import { fetchUnreadCounts } from '@/store/slices/unreadSlice'
import { formatTime, getSender } from '@/lib/utils'
import toast from 'react-hot-toast'


const MyChats = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [showGroupModal, setShowGroupModal] = useState(false)
  const [groupChatName, setGroupChatName] = useState('')
  const [selectedUsers, setSelectedUsers] = useState([])
  const [groupUserSearch, setGroupUserSearch] = useState('')
  const [groupUserResults, setGroupUserResults] = useState([])

  const dispatch = useDispatch()
  const { chats, selectedChat, loading } = useSelector((state) => state.chat)
  const { user, searchResults = [], searchLoading = false } =
    useSelector((state) => state.auth || {})
  const { unreadChatCounts } = useSelector((state) => state.unread)

  useEffect(() => {
    if (user && user._id) {
      dispatch(fetchChats())
      dispatch(fetchUnreadCounts())
    }
  }, [dispatch, user])

  useEffect(() => {
    if (searchQuery.trim()) {
      const timeoutId = setTimeout(() => {
        dispatch(searchUsers(searchQuery))
        setShowSearchResults(true)
      }, 300)
      return () => clearTimeout(timeoutId)
    } else {
      setShowSearchResults(false)
      dispatch(clearSearchResults())
    }
  }, [searchQuery, dispatch])

  useEffect(() => {
    if (groupUserSearch.trim()) {
      const timeoutId = setTimeout(async () => {
        const res = await dispatch(searchUsers(groupUserSearch))
        if (searchUsers.fulfilled.match(res)) {
          setGroupUserResults(res.payload)
        }
      }, 300)
      return () => clearTimeout(timeoutId)
    } else {
      setGroupUserResults([])
    }
  }, [groupUserSearch, dispatch])

  const handleSearchUser = async (userId) => {
    try {
      const resultAction = await dispatch(createChat({ userId }))
      if (createChat.fulfilled.match(resultAction)) {
        dispatch(setSelectedChat(resultAction.payload))
        setSearchQuery('')
        setShowSearchResults(false)
        toast.success('Chat created successfully!')
      }
    } catch (error) {
      toast.error('Failed to create chat')
    }
  }

  const handleCreateGroupChat = async () => {
    if (!groupChatName.trim() || selectedUsers.length < 2) {
      toast.error('Please provide a group name and select at least 2 users')
      return
    }
    try {
      const resultAction = await dispatch(
        createGroupChat({
          name: groupChatName,
          users: selectedUsers.map((user) => user._id),
        })
      )
      if (createGroupChat.fulfilled.match(resultAction)) {
        dispatch(setSelectedChat(resultAction.payload))
        setShowGroupModal(false)
        setGroupChatName('')
        setSelectedUsers([])
        toast.success('Group chat created successfully!')
      }
    } catch (error) {
      toast.error('Failed to create group chat')
    }
  }

  const toggleUserSelection = (userToToggle) => {
    if (selectedUsers.find((user) => user._id === userToToggle._id)) {
      setSelectedUsers(selectedUsers.filter((user) => user._id !== userToToggle._id))
    } else {
      setSelectedUsers([...selectedUsers, userToToggle])
    }
  }

  const sortedChats = useMemo(() => {
    if (!Array.isArray(chats)) return []

    const resolveTime = (chat) => {
      const timestamp = chat?.latestMessage?.createdAt || chat?.updatedAt || chat?.createdAt
      return timestamp ? new Date(timestamp).getTime() : 0
    }

    return [...chats].sort((a, b) => resolveTime(b) - resolveTime(a))
  }, [chats])

  return (
    <div className="w-80 border-r bg-card flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Chats</h2>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowGroupModal(true)}
            >
              <Users className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Search Results */}
      <AnimatePresence>
        {showSearchResults && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-b bg-muted/50"
          >
            <div className="p-2">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Search Results
              </h3>
              {searchLoading ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : searchResults?.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No users found
                </p>
              ) : (
                <div className="space-y-1">
                  {searchResults?.map((searchUser) => (
                    <motion.div
                      key={searchUser._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-accent cursor-pointer"
                      onClick={() => handleSearchUser(searchUser._id)}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={searchUser.avatar} alt={searchUser.name} />
                        <AvatarFallback>
                          {searchUser.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{searchUser.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {searchUser.email}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chats List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : chats?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">
              No chats yet
            </h3>
            <p className="text-sm text-muted-foreground">
              Start a conversation by searching for users above
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {sortedChats.map((chat) => (
              <motion.div
                key={chat._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedChat?._id === chat._id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                }`}
                onClick={() => dispatch(setSelectedChat(chat))}
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={
                      chat.isGroupChat
                        ? chat.groupAvatar
                        : getSender(user, chat.users)?.avatar
                    }
                    alt={
                      chat.isGroupChat
                        ? chat.chatName
                        : getSender(user, chat.users)?.name
                    }
                  />
                  <AvatarFallback>
                    {chat.isGroupChat
                      ? chat.chatName.charAt(0).toUpperCase()
                      : getSender(user, chat.users)?.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium truncate">
                      {chat.isGroupChat
                        ? chat.chatName
                        : getSender(user, chat.users)?.name}
                    </h3>
                    <div className="flex items-center space-x-2">
                      {chat.latestMessage && (
                        <span className="text-xs text-muted-foreground">
                          {formatTime(chat.latestMessage.createdAt)}
                        </span>
                      )}
                      <UnreadBadge
                        count={unreadChatCounts[chat._id]}
                        className="flex-shrink-0"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {chat.latestMessage
                      ? chat.latestMessage.content
                      : 'No messages yet'}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Group Chat Modal */}
      <AnimatePresence>
        {showGroupModal && (
          <motion.div
            key="group-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 pointer-events-auto"
            onClick={() => setShowGroupModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card p-6 rounded-lg shadow-xl max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4">Create Group Chat</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Group Name</label>
                  <Input
                    placeholder="Enter group name"
                    value={groupChatName}
                    onChange={(e) => setGroupChatName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Select Users</label>
                  <Input
                    placeholder="Search users..."
                    value={groupUserSearch}
                    onChange={(e) => setGroupUserSearch(e.target.value)}
                    className="mt-1"
                  />
                  <div className="mt-2 max-h-40 overflow-y-auto space-y-2">
                    {groupUserResults.map((searchUser) => (
                      <div
                        key={searchUser._id}
                        className={`flex items-center space-x-2 p-2 rounded cursor-pointer ${
                          selectedUsers.find((user) => user._id === searchUser._id)
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-accent'
                        }`}
                        onClick={() => toggleUserSelection(searchUser)}
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={searchUser.avatar} alt={searchUser.name} />
                          <AvatarFallback>
                            {searchUser.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{searchUser.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowGroupModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCreateGroupChat}>
                    Create Group
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default MyChats

