import moment from 'moment'
import { Message, MessageAttachment } from 'discord.js'
import logger from './Logger'
import { redis } from './Redis'
import { getUserDisplayName } from './utils/GetUserDisplayName'
import { NEWLINE } from './utils/GetNewline'

/** Get the latest messages from the store */
export const getMessages = (channelId: string): Promise<string[]> => (
  redis.lrange(`c:${channelId}:msg`, 0, -1)
)

/** Push a message on the store */
export const addMessage = async (message: Message, content = message.cleanContent, time = message.createdAt): Promise<void> => {
  const { author, channel } = message
  const prettyDate = moment(time).format('DD/MM/YYYY HH:mm:ss')

  try {
    const msgIsSpoiler = content.startsWith('--spoiler') || content.startsWith('spoiler')
    const safeContent = content && content.replace(/(\r\n|\n|\r)/gm, ' ').replace(/`/g, "'")
    const baseData = `[${prettyDate}]  ${getUserDisplayName(message)}:`
    let data = `${baseData} ${!msgIsSpoiler ? safeContent : '[ha scritto uno spoiler]'}`

    if (message.attachments.size) {
      if (safeContent) {
        data += ' '
      }
      data += `[Allegato] ${message.attachments.first().url}`
    }

    await Promise.all([
      // Increment the user messages count
      redis.hincrby(`u:${author.id}`, 'msg', 1),

      // Push the message to the public log
      redis.lpush(`c:${channel.id}:msg`, data)
    ])

    // Trim the messages to limit memory usage
    await redis.ltrim(`c:${channel.id}:msg`, 0, 999)
  } catch (err) {
    logger.error(err)
  }
}

export const buildLogAttachment = async (channelId: string, logName: string) => {
  // Get a copy of the store
  const messages = await getMessages(channelId)

  // Create the log
  if (!messages.length) return

  let log = ''
  for (let i = 0, len = messages.length; i < len; i++) {
    log += `- ${messages[i]}${NEWLINE}`
  }

  // Send the log
  const logBuffer = Buffer.from(log, 'utf8')
  return {
    attachment: new MessageAttachment(logBuffer, logName)
  }
}
