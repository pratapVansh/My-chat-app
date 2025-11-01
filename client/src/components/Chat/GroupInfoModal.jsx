import { useState } from 'react'
import { X, Upload, Users } from 'lucide-react'
import { useSelector, useDispatch } from 'react-redux'
import toast from 'react-hot-toast'
import { updateGroupAvatar } from '@/store/slices/chatSlice'

const GroupInfoModal = ({ open, onClose, group }) => {
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const [file, setFile] = useState(null)
  const isAdmin = group?.groupAdmin?._id === user?._id

  if (!open) return null

  const handleAvatarChange = (e) => setFile(e.target.files[0])

  const handleUpload = async () => {
    if (!file) return toast.error('Please select an image first!')
  
    try {
      await dispatch(updateGroupAvatar({ chatId: group._id, avatarFile: file })).unwrap()
      toast.success('Group avatar updated successfully!')
      onClose()

    } catch (error) {
      toast.error(error || 'Failed to update group avatar')
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4"
      onClick={onClose}
    >
      <div
        className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md p-6 transition-transform duration-300 ease-in-out hover:scale-[1.01]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
            Group Info
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage group details and members
          </p>
        </div>

        {/* Avatar Section */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative group">
            <img
              src={group?.groupAvatar || '/default-group.png'}
              alt={group?.chatName}
              className="h-24 w-24 rounded-full object-cover border-4 border-blue-100 shadow-md group-hover:shadow-lg transition-all duration-300"
            />

            {isAdmin && (
              <>
                <label
                  htmlFor="avatar-upload"
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <Upload className="h-6 w-6 text-white" />
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </>
            )}
          </div>

          {isAdmin && file && (
            <button
              onClick={handleUpload}
              className="px-5 py-2 rounded-full bg-blue-600 text-white font-medium hover:bg-blue-700 active:scale-95 transition flex items-center gap-2"
            >
              <Upload className="h-4 w-4" /> Upload Avatar
            </button>
          )}
        </div>

        {/* Group Info */}
        <div className="mt-6 text-center">
          <p className="font-semibold text-lg text-gray-800 dark:text-white">
            {group?.chatName}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Admin: {group?.groupAdmin?.name}
          </p>
        </div>

        {/* Members List */}
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-blue-600" />
            <p className="font-medium text-gray-700 dark:text-gray-300">Members</p>
          </div>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400 max-h-40 overflow-y-auto border border-gray-200 dark:border-zinc-700 rounded-lg p-3">
            {group?.users?.map((u) => (
              <li
                key={u._id}
                className="flex justify-between items-center bg-gray-50 dark:bg-zinc-800 px-3 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-700 transition"
              >
                <span>{u.name}</span>
                {u._id === group.groupAdmin?._id && (
                  <span className="text-xs text-blue-600 font-medium">(Admin)</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default GroupInfoModal
