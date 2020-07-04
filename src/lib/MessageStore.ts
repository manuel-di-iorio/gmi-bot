import moment from 'moment'
import { Message } from 'discord.js'
import logger from './Logger'
import { redis } from './Redis'
import { getUserDisplayName } from './utils/GetUserDisplayName'

/** Get the latest messages from the store */
export const getMessages = (channelId: string): Promise<string[]> => (
  redis.lrange(`c:${channelId}:msg`, 0, 199)
)

/** Push a message on the store */
export const addMessage = async (message: Message, content = message.cleanContent, time = message.createdAt): Promise<void> => {
  const { author, channel } = message
  const prettyDate = moment(time).format('DD/MM/YYYY HH:mm:ss')

  try {
    const msgIsSpoiler = content.startsWith('--spoiler')
    const safeContent = content && content.replace(/(\r\n|\n|\r)/gm, ' ').replace(/`/g, "'")
    const baseData = `[${prettyDate}]  ${getUserDisplayName(message)}:`
    let data = `${baseData} ${!msgIsSpoiler ? safeContent : '[ha scritto uno spoiler]'}`
    let spoilerData = `${baseData} ${safeContent}`

    if (message.attachments.size) {
      if (safeContent) {
        data += ' '
        spoilerData += ' '
      }
      data += `[Allegato] ${message.attachments.first().url}`
      spoilerData += `[Allegato] ${message.attachments.first().url}`
    }

    await Promise.all([
      // Increment the user messages count
      redis.hincrby(`u:${author.id}`, 'msg', 1),

      // Push the message to the public log
      redis.lpush(`c:${channel.id}:msg`, data),

      // If spoiler, push the message to the spoilers list
      msgIsSpoiler && redis.lpush('spoilers:cpbot:msg', spoilerData)
    ])

    // Trim the messages to limit memory usage
    await redis.ltrim(`c:${channel.id}:msg`, 0, 299)
  } catch (err) {
    logger.error(err)
  }
}
