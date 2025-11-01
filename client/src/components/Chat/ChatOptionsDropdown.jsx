import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { MoreVertical, Trash, XCircle, Info } from 'lucide-react'
import { useDispatch } from 'react-redux'
import { deleteAllMessages } from '@/store/slices/messageSlice'
import { deleteChat } from '@/store/slices/chatSlice'
import GroupInfoModal from './GroupInfoModal' // ✅ new modal

const ChatOptionsDropdown = ({ selectedChat }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [openGroupInfo, setOpenGroupInfo] = useState(false) // ✅ modal state
  const dropdownRef = useRef(null)
  const dispatch = useDispatch()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleDeleteAll = () => {
    setDropdownOpen(false)
    if (window.confirm('Are you sure you want to delete all messages in this chat?')) {
      dispatch(deleteAllMessages(selectedChat._id))
    }
  }

  const handleDeleteChat = () => {
    setDropdownOpen(false)
    if (window.confirm('Are you sure you want to delete this chat? This will remove it from your chat list.')) {
      dispatch(deleteChat(selectedChat._id))
    }
  }

  const handleOpenGroupInfo = () => {
    setDropdownOpen(false)
    setOpenGroupInfo(true)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <MoreVertical className="h-5 w-5 text-gray-600 dark:text-gray-300" />
      </Button>

      {dropdownOpen && (
        <div 
          className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden z-20
                     animate-slide-down fade-in"
        >
          {/* ✅ Show only if it's a group chat */}
          {selectedChat?.isGroupChat && (
            <button
              className="flex items-center px-4 py-3 w-full text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700"
              onClick={handleOpenGroupInfo}
            >
              <Info className="mr-3 h-5 w-5 text-blue-500" /> Group Info
            </button>
          )}

          <button
            className="flex items-center px-4 py-3 w-full text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900 dark:text-red-400 dark:hover:text-red-200 transition-colors"
            onClick={handleDeleteAll}
          >
            <Trash className="mr-3 h-5 w-5" /> Delete All Messages
          </button>

          <button
            className="flex items-center px-4 py-3 w-full text-left text-red-700 hover:bg-red-100 dark:hover:bg-red-900 dark:text-red-400 dark:hover:text-red-200 transition-colors border-t border-gray-100 dark:border-gray-700"
            onClick={handleDeleteChat}
          >
            <XCircle className="mr-3 h-5 w-5" /> Delete Chat
          </button>
        </div>
      )}

      {/* ✅ Modal for Group Info */}
      {selectedChat?.isGroupChat && (
        <GroupInfoModal
          open={openGroupInfo}
          onClose={() => setOpenGroupInfo(false)}
          group={selectedChat}
        />
      )}
    </div>
  )
}

export default ChatOptionsDropdown
