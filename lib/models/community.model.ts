import mongoose, { Document } from 'mongoose'

export interface ICommunity extends Document {
  id: string
  username: string
  name: string
  image: string
  bio: string
  createdBy: mongoose.Types.ObjectId
  threads: mongoose.Types.ObjectId[]
  members: mongoose.Types.ObjectId[]
}

const communitySchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    unique: true,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  image: String,
  bio: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  threads: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Threads',
    },
  ],
  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
})

const Community =
  mongoose.models.Community ||
  mongoose.model<ICommunity>('Community', communitySchema)
export default Community as mongoose.Model<ICommunity>
