import mongoose from 'mongoose'

const chatSchema = mongoose.Schema(
  {
    chatName: {
      type: String,
      trim: true,
    },
    isGroupChat: {
      type: Boolean,
      default: false,
    },
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    latestMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    groupAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    groupAvatar: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
)

// Virtual for getting the other user in a one-to-one chat
chatSchema.virtual('otherUser', {
  ref: 'User',
  localField: 'users',
  foreignField: '_id',
  justOne: true,
})

// Ensure chat name is set for group chats
chatSchema.pre('save', function (next) {
  if (this.isGroupChat && !this.chatName) {
    this.chatName = this.users
      .map((user) => user.name || user.toString())
      .join(', ')
  }
  next()
})

export default mongoose.model('Chat', chatSchema)
