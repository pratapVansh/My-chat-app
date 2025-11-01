import { useDispatch, useSelector } from 'react-redux'
import { useEffect, useMemo, useRef, useState } from 'react'
import { LogOut, User, Settings, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import MyChats from '@/components/Chat/MyChats'
import ChatBox from '@/components/Chat/ChatBox'
import { logoutUser, uploadAvatar } from '@/store/slices/authSlice'
import { clearMessages } from '@/store/slices/messageSlice'
import { clearSelectedChat } from '@/store/slices/chatSlice'
import { disconnectSocket } from '@/lib/socket'
import { useTheme } from '@/contexts/ThemeContext'
import toast from 'react-hot-toast'


const ChatPage = () => {
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const { isDark, toggleTheme } = useTheme()
  const [tempAvatar, setTempAvatar] = useState(() => localStorage.getItem('tempAvatar') || '')
  const fileInputRef = useRef(null)

  const currentAvatarSrc = tempAvatar || user?.avatar || ''

  const handleLogout = async () => {
    try {

      disconnectSocket()
      await dispatch(logoutUser())
      dispatch(clearMessages())
      dispatch(clearSelectedChat())
      
      localStorage.removeItem('accessToken')
      localStorage.removeItem('user')
      localStorage.removeItem('tempAvatar')
      toast.success('Logged out successfully')
    } catch (error) {
      toast.error('Logout failed')
    }
  }

  const handlePickAvatar = () => fileInputRef.current?.click()

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result
      localStorage.setItem('tempAvatar', dataUrl)
      setTempAvatar(dataUrl)
    }
    reader.readAsDataURL(file)

    // Upload to server (Cloudinary) after temporarily storing preview

   
    try {
      await dispatch(uploadAvatar(file)).unwrap()
      localStorage.removeItem('tempAvatar')
      setTempAvatar('')
      toast.success('Avatar updated')
    } catch (err) {
      const errorMessage = err?.message || err || 'Avatar upload failed'
      toast.error(errorMessage)
    } finally {
      e.target.value = ''
    }
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-80 border-r bg-card flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-primary">ChatApp</h1>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon" onClick={toggleTheme}>
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* User Profile */}
        <div className="p-4 border-b">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={currentAvatarSrc} alt={user?.name} />
              <AvatarFallback>
                {user?.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            <Button variant="ghost" size="icon" onClick={handlePickAvatar} title="Change avatar">
              <User className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Chats */}
        <div className="flex-1 overflow-hidden">
          <MyChats />
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <ChatBox />
      </div>
    </div>
  )
}

export default ChatPage
