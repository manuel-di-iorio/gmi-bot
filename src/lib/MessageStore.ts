import moment from 'moment'
import { Message } from 'discord.js'
import logger from './Logger'
import { redis } from './Redis'
import { GMI_MEMBER_ROLE } from './Config'
import { getUserDisplayName } from './GetUserDisplayName'

/** Get the latest messages from the store */
export const getMessages = (channelId: string): Promise<string[]> => (
  redis.lrange(`c:${channelId}:msg`, 0, 299)
)

/** Push a message on the store */
export const addMessage = async (message: Message): Promise<void> => {
  const { guild, author, channel, content } = message

  const guildMember = guild.members.cache.get(author.id)
  const isGmiMember = guildMember.roles.cache.has(GMI_MEMBER_ROLE)
  const prettyDate = moment(message.createdAt).format('DD/MM/YYYY HH:mm:ss')

  try {
    const data = `[${prettyDate}]  ${getUserDisplayName(message)}: ${content && content.replace(/(\r\n|\n|\r)/gm, ' ')}`
    await Promise.all([
      // Increment the user messages count (only for new users)
      !isGmiMember && redis.hincrby(`u:${author.id}`, 'msg', 1),

      // Push the message
      redis.lpush(`c:${channel.id}:msg`, data)
    ])

    // Trim the messages to limit memory usage
    await redis.ltrim(`c:${channel.id}:msg`, 0, 299)
  } catch (err) {
    logger.error(err)
  }
}
