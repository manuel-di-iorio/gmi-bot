import { Message, TextChannel } from 'discord.js'
import { GMI_GUILD } from './Config'
import { bot } from './Discord'
import logger from './Logger'
import { redis, scanKeys } from './Redis'
import * as Discussion from '../models/Discussion'

/**
 * Delete old discussion channels on expiration
 */
export const deleteOldDiscussionChannels = async () => {
  try {
    const mainChannel = bot.channels.cache.get(GMI_GUILD) as TextChannel
    if (!mainChannel) return

    const discussionsKeys = await scanKeys('disc:*')

    // Get redis keys
    const tasks = []
    for (const discussionKey of discussionsKeys) {
      tasks.push(async () => ({
        key: discussionKey,
        data: JSON.parse(await redis.get(discussionKey))
      }))
    }
    const discussions = await Promise.all(tasks.map(task => task()))

    // Remove expired channels
    const timeNow = +new Date()
    const deleteTasks = []
    for (const discussion of discussions) {
      if (discussion.data.expiresAt > timeNow) continue
      deleteTasks.push(async () => {
        const channel = await mainChannel.guild.channels.cache.get(discussion.data.id)

        await Promise.all([
          redis.del(discussion.key),
          channel && channel.delete()
        ])
      })
    }
    await Promise.all(deleteTasks.map(task => task()))
  } catch (err) {
    logger.error(err)
  }
}

/**
 * Extend the discussion channel expiration when a message arrives
 */
export const extendTempChannels = async (message: Message) => {
  try {
    const channelId = message.channel.id
    const discussionsKeys = await scanKeys('disc:*')

    // Get redis keys
    const tasks = []
    for (const discussionKey of discussionsKeys) {
      tasks.push(async () => ({
        key: discussionKey,
        data: JSON.parse(await redis.get(discussionKey))
      }))
    }
    const discussions = await Promise.all(tasks.map(task => task()))

    for (const discussion of discussions) {
      if (discussion.data.id !== channelId) continue
      const userId = discussion.key.split(':').pop()
      await Discussion.createOrExtend(userId, channelId)
    }
  } catch (err) {
    logger.error(err)
  }
}
