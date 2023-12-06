import mongoose from 'mongoose'

export interface IThread {
  text: string
  author: mongoose.Types.ObjectId
  community: mongoose.Types.ObjectId
  createdAt: Date
  parentId: string
  children: mongoose.Types.ObjectId[]
}

const threadSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    requried: true,
  },
  community: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  parentId: {
    type: String,
  },
  children: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Thread',
    },
  ],
})

const Thread = mongoose.models.Thread || mongoose.model<IThread>('Thread', threadSchema)
export default Thread as mongoose.Model<IThread>
