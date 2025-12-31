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
    <div className="flex-1 flex flex-col">
      {/* Search */}
      <div className="px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 bg-secondary/50 border-transparent hover:bg-secondary focus:bg-background transition-colors"
          />
        </div>
        <div className="flex items-center justify-end gap-1 mt-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs hover:bg-accent/50 transition-colors"
            onClick={() => setShowGroupModal(true)}
          >
            <Users className="h-3.5 w-3.5 mr-1.5" />
            New Group
          </Button>
        </div>
      </div>

      {/* Search Results */}
      <AnimatePresence>
        {showSearchResults && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-b bg-secondary/30"
          >
            <div className="px-4 py-2">
              <h3 className="text-[13px] font-medium text-muted-foreground mb-2 px-1">
                People
              </h3>
              {searchLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary/30 border-t-primary"></div>
                </div>
              ) : searchResults?.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No users found
                </p>
              ) : (
                <div className="space-y-0.5">
                  {searchResults?.map((searchUser) => (
                    <motion.div
                      key={searchUser._id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent/70 cursor-pointer transition-colors"
                      onClick={() => handleSearchUser(searchUser._id)}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={searchUser.avatar} alt={searchUser.name} />
                        <AvatarFallback className="text-sm">
                          {searchUser.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-medium truncate leading-tight">{searchUser.name}</p>
                        <p className="text-[13px] text-muted-foreground truncate leading-tight mt-0.5">
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
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary/30 border-t-primary"></div>
          </div>
        ) : chats?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-8 py-12">
            <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
              <MessageCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-base font-medium mb-1">
              No conversations yet
            </h3>
            <p className="text-sm text-muted-foreground">
              Search for people to start chatting
            </p>
          </div>
        ) : (
          <div className="px-2 py-1 space-y-0.5">
            {sortedChats.map((chat) => (
              <motion.div
                key={chat._id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all duration-150 ${
                  selectedChat?._id === chat._id
                    ? 'bg-primary/10 shadow-sm'
                    : 'hover:bg-accent/70'
                }`}
                onClick={() => dispatch(setSelectedChat(chat))}
              >
                <Avatar className="h-12 w-12 ring-1 ring-border/50">
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
                  <AvatarFallback className="text-sm">
                    {chat.isGroupChat
                      ? chat.chatName.charAt(0).toUpperCase()
                      : getSender(user, chat.users)?.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-[15px] font-medium truncate leading-tight">
                      {chat.isGroupChat
                        ? chat.chatName
                        : getSender(user, chat.users)?.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      {chat.latestMessage && (
                        <span className="text-[12px] text-muted-foreground font-normal">
                          {formatTime(chat.latestMessage.createdAt)}
                        </span>
                      )}
                      <UnreadBadge
                        count={unreadChatCounts[chat._id]}
                        className="flex-shrink-0"
                      />
                    </div>
                  </div>
                  <p className="text-[13px] text-muted-foreground truncate leading-tight">
                    {chat.latestMessage
                      ? chat.latestMessage.content
                      : 'Start a conversation'}
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 pointer-events-auto"
            onClick={() => setShowGroupModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-card border border-border p-6 rounded-2xl shadow-2xl max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-5">Create Group Chat</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Group Name</label>
                  <Input
                    placeholder="Enter group name"
                    value={groupChatName}
                    onChange={(e) => setGroupChatName(e.target.value)}
                    className="h-11 bg-secondary/50 border-transparent hover:bg-secondary focus:bg-background transition-colors"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Add Members</label>
                  <Input
                    placeholder="Search users..."
                    value={groupUserSearch}
                    onChange={(e) => setGroupUserSearch(e.target.value)}
                    className="h-11 bg-secondary/50 border-transparent hover:bg-secondary focus:bg-background transition-colors"
                  />
                  <div className="mt-3 max-h-48 overflow-y-auto space-y-1">
                    {groupUserResults.map((searchUser) => (
                      <div
                        key={searchUser._id}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                          selectedUsers.find((user) => user._id === searchUser._id)
                            ? 'bg-primary/10 ring-1 ring-primary/20'
                            : 'hover:bg-accent/70'
                        }`}
                        onClick={() => toggleUserSelection(searchUser)}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={searchUser.avatar} alt={searchUser.name} />
                          <AvatarFallback className="text-xs">
                            {searchUser.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-[14px] font-medium">{searchUser.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowGroupModal(false)}
                    className="hover:bg-accent/50"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateGroupChat}
                    className="shadow-sm"
                  >
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

