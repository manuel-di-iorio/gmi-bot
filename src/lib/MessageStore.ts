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
export const addMessage = async (message: Message): Promise<void> => {
  const { author, channel, content } = message
  const prettyDate = moment(message.createdAt).format('DD/MM/YYYY HH:mm:ss')

  try {
    const contentClean = content && content.replace(/(\r\n|\n|\r)/gm, ' ').replace(/`/g, "'")
    let data = `[${prettyDate}]  ${getUserDisplayName(message)}: ${contentClean}`

    if (message.attachments.size) {
      if (contentClean) data += ' '
      data += `[Allegato] ${message.attachments.first().url}`
    }

    await Promise.all([
      // Increment the user messages count
      redis.hincrby(`u:${author.id}`, 'msg', 1),

      // Push the message
      redis.lpush(`c:${channel.id}:msg`, data)
    ])

    // Trim the messages to limit memory usage
    await redis.ltrim(`c:${channel.id}:msg`, 0, 199)
  } catch (err) {
    logger.error(err)
  }
}
