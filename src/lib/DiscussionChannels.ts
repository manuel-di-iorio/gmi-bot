import { CategoryChannel, Collection, GuildChannel, Message, TextChannel } from 'discord.js'
import { GMI_DISCUSSION_CATEGORY_ID, GMI_GUILD } from './Config'
import { bot } from './Discord'
import logger from './Logger'
import { redis, scanKeys } from './Redis'
import * as Discussion from '../models/Discussion'
import { getUserDisplayName } from './utils/GetUserDisplayName'

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
    let deletedChannels = 0
    const timeNow = +new Date()
    const deleteTasks = []
    for (const discussion of discussions) {
      if (discussion.data.expiresAt > timeNow) continue
      deletedChannels++

      deleteTasks.push(async () => {
        const channel = await mainChannel.guild.channels.cache.get(discussion.data.id)

        await Promise.all([
          redis.del(discussion.key),
          channel && channel.delete()
        ])
      })
    }
    await Promise.all(deleteTasks.map(task => task()))

    // Move the Discussions category on bottom, when there are no more channels in it
    if (discussions.length === deletedChannels) {
      const latestCategoryPos = (bot.channels.cache as Collection<string, GuildChannel>).reduce((pos, category) =>
        Math.max(pos, category.type === 'category' && category.position), 0)
      const discussionChannel = bot.channels.cache.get(GMI_DISCUSSION_CATEGORY_ID) as CategoryChannel
      await discussionChannel.setPosition(latestCategoryPos)
    }
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
      if (discussion.data?.id !== channelId) continue
      const userId = discussion.key.split(':').pop()
      await Discussion.createOrExtend(userId, channelId)
    }
  } catch (err) {
    logger.error(err)
  }
}

export const createDiscussionChannelByHashtag = async (message: Message, content: string) => {
  try {
    // Command validation
    if (!content || content[0] !== '#' || content.replace(/#[\S]+/, '')) return
    const channelName = content.slice(1)

    // Check if the channel to create already exists in the Server channels list
    // if ((bot.channels.cache as Collection<string, GuildChannel>).find(ch => ch.name === channelName)) {
    //   return message.reply('un canale con questo nome già esiste')
    // }

    const userId = message.author.id
    const hasChannel = await Discussion.getByUser(userId)
    if (hasChannel) return message.reply('hai già creato un canale temporaneo')

    // Create the channel
    const channel = await message.guild.channels.create(channelName, {
      topic: 'Canale temporaneo creato da ' + getUserDisplayName(message),
      parent: GMI_DISCUSSION_CATEGORY_ID
    })

    // Delete the user message
    // message.delete().catch((err: Error) => logger.error(err))

    // Store the channel on Redis
    await Discussion.createOrExtend(userId, channel.id)
    await message.reply(`ho creato il canale temporaneo ${channel}`)

    // Move Discussions category on top
    const discussionChannel = bot.channels.cache.get(GMI_DISCUSSION_CATEGORY_ID) as CategoryChannel
    await discussionChannel.setPosition(1)
  } catch (err) {
    logger.error(err)
  }
}
