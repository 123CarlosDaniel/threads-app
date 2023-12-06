'use server'

import { revalidatePath } from 'next/cache'
import Thread from '../models/thread.model'
import User from '../models/user.model'
import { connectToDB } from '../mongoose'
import Community from '../models/community.model'

interface Params {
  text: string
  author: string
  communityId: string | null
  path: string
}

export async function createThread(data: Params) {
  connectToDB()

  const communityIdObject = await Community.findOne(
    { id: data.communityId },
    { _id: 1 }
  )
    console.log({communityIdObject})
  const createdThread = await Thread.create({
    text: data.text,
    author: data.author,
    community: communityIdObject,
  })

  await User.findByIdAndUpdate(data.author, {
    $push: { threads: createdThread._id },
  })

  if (communityIdObject) {
    await Community.findByIdAndUpdate(communityIdObject, {
      $push: { threads: createdThread._id },
    })
  }

  revalidatePath(data.path)
}

export async function fetchThreads(pageNumber = 1, pageSize = 20) {
  connectToDB()
  const skipAmount = (pageNumber - 1) * pageSize

  const threadsQuery = Thread.find({ parentId: { $in: [null, undefined] } })
    .sort({ createAt: 'desc' })
    .skip(skipAmount)
    .limit(pageSize)
    .populate({ path: 'author', model: User })
    .populate({
      path: 'children',
      populate: {
        path: 'author',
        model: User,
        select: '_id name parentId image',
      },
    })

  const totalPostsCount = await Thread.countDocuments({
    parentId: { $in: [null, undefined] },
  })
  const posts = await threadsQuery.exec()
  const isNext = totalPostsCount > posts.length + skipAmount

  return { posts, isNext } as { posts: any[]; isNext: boolean }
}

export async function fetchThreadById(id: string) {
  connectToDB()
  try {
    // Todo
    const thread = await Thread.findById(id)
      .populate({
        path: 'author',
        model: User,
        select: '_id id name image',
      })
      .populate({
        path: 'children',
        populate: [
          {
            path: 'author',
            model: User,
            select: '_id id name parentId image',
          },
          {
            path: 'children',
            model: Thread,
            populate: {
              path: 'author',
              model: User,
              select: '_id id name parentId image',
            },
          },
        ],
      })
      .exec()
    return thread as any
  } catch (error: any) {
    throw new Error(`Error fetching thread : ${error.message}`)
  }
}

export async function addCommentToThread(
  threadId: string,
  commentText: string,
  userId: string,
  path: string
) {
  connectToDB()
  try {
    const originalThread = await Thread.findById(threadId)
    if (!originalThread) {
      throw new Error('Thread not found')
    }

    const commentThread = new Thread({
      text: commentText,
      author: userId,
      parentId: threadId,
    })
    const savedCommentThread = await commentThread.save()

    originalThread.children.push(savedCommentThread._id)
    await originalThread.save()

    revalidatePath(path)
  } catch (error: any) {
    throw new Error(`Error adding comment to thread ${error.message}`)
  }
}
