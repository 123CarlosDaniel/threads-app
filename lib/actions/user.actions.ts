'use server'

import { revalidatePath } from 'next/cache'
import User from '../models/user.model'
import { connectToDB } from '../mongoose'
import Thread from '../models/thread.model'
import { FilterQuery, SortOrder } from 'mongoose'
import Community from '../models/community.model'

interface Params {
  userId: string
  username: string
  name: string
  bio: string
  image: string
  path: string
}

export async function updateUser(data: Params): Promise<void> {
  try {
    connectToDB()
    await User.findOneAndUpdate(
      { id: data.userId },
      {
        username: data.username.toLowerCase(),
        name: data.name,
        bio: data.bio,
        image: data.image,
        onboarded: true,
      },
      { upsert: true }
    )
    if (data.path === '/profile/edit') {
      revalidatePath(data.path)
    }
  } catch (error: any) {
    throw new Error(`Failed to create/update user: ${error.message}`)
  }
}

export async function fetchUser(userId: string) {
  try {
    connectToDB()
    return (await User.findOne({ id: userId }))?.populate({
      path: 'communities',
      model: Community,
    })
  } catch (error: any) {
    throw new Error(`Failed to fetch user: ${error.message}`)
  }
}

export async function fetchUserPosts(userId: string) {
  try {
    connectToDB()

    const threads = await User.findOne({ id: userId }).populate({
      path: 'threads',
      model: Thread,
      populate: [
        {
          path: 'community',
          model: Community,
          select: 'name id image _id'
        },
        {
          path: 'children',
          model: Thread,
          populate: {
            path: 'author',
            model: User,
            select: 'name image id',
          },
        },
      ],
    })
    return threads as any
  } catch (error: any) {
    throw new Error(`Error fetching threads: ${error.message}`)
  }
}

export async function fetchUsers({
  userId,
  searchString = '',
  pageNumber = 1,
  pageSize = 20,
  sortBy = 'desc',
}: {
  userId: string
  searchString?: string
  pageNumber?: number
  pageSize?: number
  sortBy?: SortOrder
}) {
  try {
    connectToDB()
    const skipAmount = (pageNumber - 1) * pageSize
    const regex = new RegExp(searchString, 'i')

    const query: FilterQuery<typeof User> = {
      id: { $ne: userId },
    }

    if (searchString.trim() !== '') {
      query.$or = [{ username: { $regex: regex } }, { name: { $regex: regex } }]
    }

    const sortOptions = { createdAt: sortBy }
    const usersQuery = User.find(query)
      .sort(sortOptions)
      .skip(skipAmount)
      .limit(pageSize)

    const totalUsersCount = await User.countDocuments(query)
    const users = await usersQuery.exec()
    const isNext = totalUsersCount > skipAmount + users.length

    return { users, isNext } as { users: any[]; isNext: boolean }
  } catch (error: any) {
    throw new Error(`Error fetching data : ${error.message}`)
  }
}

export async function getActivity(userId: string) {
  try {
    connectToDB()

    const userThreads = (await Thread.find({ author: userId })) as any[]
    const childThreadsIds = userThreads.reduce((acc, userThread) => {
      return acc.concat(userThread.children)
    }, [])

    const replies = await Thread.find({
      _id: { $in: childThreadsIds },
      author: { $ne: userId },
    }).populate({
      path: 'author',
      model: User,
      select: 'name image _id id',
    })

    return replies as any[]
  } catch (error: any) {
    throw new Error(`Error fetching activity: ${error.message}`)
  }
}
