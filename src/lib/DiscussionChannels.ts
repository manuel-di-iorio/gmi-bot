// import { /* CategoryChannel, Collection, GuildChannel, */ Message, Snowflake, TextChannel } from 'discord.js'
// import { GMI_ARCHIVED_DISCUSSION_CH_ID, GMI_DISCUSSION_CATEGORY_ID, GMI_GUILD } from './Config'
// import { bot } from './Discord'
// import logger from './Logger'
// import { redis, scanKeys } from './Redis'
// import * as Discussion from '../models/Discussion'
// import { getUserDisplayName } from './utils/GetUserDisplayName'
// import { buildLogAttachment } from './MessageStore'

// /**
//  * Delete old discussion channels on expiration
//  */
// export const deleteOldDiscussionChannels = async () => {
//   try {
//     const mainChannel = bot.channels.cache.get(GMI_GUILD as Snowflake) as TextChannel
//     if (!mainChannel) return
//     const archivedDiscussionCh = bot.channels.cache.get(GMI_ARCHIVED_DISCUSSION_CH_ID as Snowflake) as TextChannel

//     // Get redis keys
//     const discussionsKeys = await scanKeys('disc:*')

//     const tasks = []
//     for (const discussionKey of discussionsKeys) {
//       tasks.push(async () => ({
//         key: discussionKey,
//         data: JSON.parse(await redis.get(discussionKey))
//       }))
//     }
//     const discussions = await Promise.all(tasks.map(task => task()))

//     // Remove expired channels
//     // let deletedChannels = 0
//     const timeNow = +new Date()
//     const deleteTasks = []
//     for (const discussion of discussions) {
//       const channelId = discussion.data.id
//       const channel = bot.channels.cache.get(channelId) as TextChannel
//       const expiresAt = discussion.data.expiresAt
//       if (expiresAt > timeNow) continue

//       // deletedChannels++
//       deleteTasks.push(async () => {
//         const log = await buildLogAttachment(channelId, channel.name + '.txt')

//         await Promise.all([
//           log && archivedDiscussionCh.send({ files: [log.attachment] }),
//           redis.del(discussion.key),
//           channel && channel.delete()
//         ])
//       })
//     }
//     await Promise.all(deleteTasks.map(task => task()))

//     // Move the Discussions category on bottom, when there are no more channels in it
//     // if (discussions.length === deletedChannels) {
//     //   const latestCategoryPos = (bot.channels.cache as Collection<string, GuildChannel>).reduce((pos, category) =>
//     //     Math.max(pos, category.type === 'category' && category.position), 0)
//     //   const discussionCategory = bot.channels.cache.get(GMI_DISCUSSION_CATEGORY_ID as Snowflake) as CategoryChannel
//     //   await discussionCategory.setPosition(latestCategoryPos)
//     // }
//   } catch (err) {
//     logger.error(err)
//   }
// }

// /**
//  * Extend the discussion channel expiration when a message arrives
//  */
// export const extendTempChannels = async (message: Message) => {
//   try {
//     const channelId = message.channel.id
//     const discussionsKeys = await scanKeys('disc:*')

//     // Get redis keys
//     const tasks = []
//     for (const discussionKey of discussionsKeys) {
//       tasks.push(async () => ({
//         key: discussionKey,
//         data: JSON.parse(await redis.get(discussionKey))
//       }))
//     }
//     const discussions = await Promise.all(tasks.map(task => task()))

//     for (const discussion of discussions) {
//       if (discussion.data?.id !== channelId) continue
//       const userId = discussion.key.split(':').pop()
//       await Discussion.createOrExtend(userId, channelId)
//     }
//   } catch (err) {
//     logger.error(err)
//   }
// }

// /**
//  * Create a discussion channel when the user writes an hashtag message
//  */
// export const createDiscussionChannelByHashtag = async (message: Message, content: string) => {
//   try {
//     // Command validation
//     if (!content || content[0] !== '#' || content[content.length - 1] !== '#') return
//     const channelName = content.substr(1, content.length - 2)
//     if (!channelName) return

//     const userId = message.author.id
//     const hasChannel = await Discussion.getByUser(userId)
//     if (hasChannel) return message.reply('hai già creato un canale temporaneo')

//     // Create the channel
//     const expireTime = new Date(+new Date() + 1000 * 60 * 60 * 24)
//     const expireHours = !expireTime.getMinutes() ? expireTime.getHours() : expireTime.getHours() + 1
//     const channel = await message.guild.channels.create(channelName, {
//       topic: 'Canale temporaneo creato da ' + getUserDisplayName(message) + ` - Scade alle ${expireHours}:00`,
//       parent: GMI_DISCUSSION_CATEGORY_ID as Snowflake
//     })

//     // Store the channel on Redis
//     await Discussion.createOrExtend(userId, channel.id)
//     await message.reply(`ho creato il canale temporaneo ${channel}`)

//     // Move Discussions category on top
//     // const discussionChannel = bot.channels.cache.get(GMI_DISCUSSION_CATEGORY_ID as Snowflake) as CategoryChannel
//     // await discussionChannel.setPosition(1)
//   } catch (err) {
//     logger.error(err)
//   }
// }

// export const updateDiscussionChannelsTopicExpiration = async () => {
//   try {
//     // Get the discussion channels
//     const discussionsKeys = await scanKeys('disc:*')

//     const tasks = []
//     for (const discussionKey of discussionsKeys) {
//       tasks.push(async () => ({
//         key: discussionKey,
//         data: JSON.parse(await redis.get(discussionKey))
//       }))
//     }
//     const discussions = await Promise.all(tasks.map(task => task()))

//     for (const discussion of discussions) {
//       const channelId = discussion.data.id
//       const channel = bot.channels.cache.get(channelId) as TextChannel
//       if (!channel) continue

//       // Remove the expiration from the topic
//       let channelTopic: string | string[] = channel.topic.split('-')
//       channelTopic.pop()
//       channelTopic = channelTopic.join('-')

//       // Update with the new topic
//       const expireTime = new Date(discussion.data.expiresAt)
//       const expireHours = !expireTime.getMinutes() ? expireTime.getHours() : expireTime.getHours() + 1
//       channelTopic += `- Scade alle ${expireHours}:00`
//       if (channel.topic !== channelTopic) await channel.setTopic(channelTopic, 'Update topic expiration')
//     }
//   } catch (err) {
//     logger.error(err)
//   }
// }

// setTimeout(() => updateDiscussionChannelsTopicExpiration(), 3000)
