import { Message, Snowflake, TextChannel } from 'discord.js'
import { GMI_LIMITED_CHS_LINK_OR_IMG, GMI_LIMITED_CHS_LIMIT_LINK } from './Config'
import logger from './Logger'
import { redis } from './Redis'
import { getUserDisplayName } from './utils/GetUserDisplayName'
import { bot } from './Discord'

const linkChs = GMI_LIMITED_CHS_LIMIT_LINK.split(',')
const linkImgChs = GMI_LIMITED_CHS_LINK_OR_IMG.split(',')

const linkRegex = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/

const isMsgInvalid = (message: Message) => {
  const { content } = message
  const channelId = message.channel.id

  // Check link channels
  if (linkChs.includes(channelId)) {
    if (!linkRegex.test(content) && !message.attachments.size) return 'link'
  } else if (linkImgChs.includes(channelId)) {
    // Check link & img channels
    if (!linkRegex.test(content) && !message.attachments.size) return "link o un'immagine"
  }
}

export const deleteInvalidMsgInLimitedChannels = async (message: Message) => {
  const limitType = isMsgInvalid(message)
  if (!limitType) return
  const { channel } = message
  const channelId = message.channel.id
  const { name: channelName } = message.guild.channels.cache.get(channelId)

  // Push the message to the invalid messages list
  redis.lpush('invalid-messages', `${channel.id}|${message.id}|${message.createdTimestamp}`)
    .catch((err: Error) => logger.error(err))

  // Send the alert to the user
  try {
    await message.author.send(`\`\`\`${message.author.username}, nel canale #${channelName} non si può inviare un messaggio che non includa un ${limitType}.
Il tuo messaggio verrà cancellato automaticamente questa notte, a meno che non modifichi il messaggio rendendolo conforme alle regole del canale\`\`\``)
  } catch (err) {
    if (err.code !== 50007) return logger.error(err)

    // Send the alert directly in the message when the user has disabled the DMs
    try {
      const alertReply = await message.channel.send(`\`\`\`${getUserDisplayName(message, message.author.id)}, in questo canale non si può inviare un messaggio che non includa un ${limitType}.
Il tuo messaggio verrà cancellato automaticamente questa notte, a meno che non modifichi il messaggio rendendolo conforme alle regole del canale\`\`\``)
      await redis.lpush('invalid-messages', `${channel.id}|${alertReply.id}|${message.createdTimestamp}`)
    } catch (replyErr) {
      logger.error(replyErr)
    }
  }
}

/**
 * Scheduler function
 */
export const deleteInvalidMsg = async () => {
  try {
    const invalidMessages = await redis.lrange('invalid-messages', 0, -1)
    if (!invalidMessages) return

    for (const invalidMessage of invalidMessages) {
      const msgSplit = invalidMessage.split('|')

      // Get and delete the message (if still invalid)
      try {
        const channel = await bot.channels.fetch(msgSplit.shift() as Snowflake) as TextChannel
        const msg = await channel.messages.fetch(msgSplit.shift() as Snowflake)
        if (msg && isMsgInvalid(msg)) await msg.delete()
      } catch (err) {
        if (err.code !== 10008) logger.error(err)
      }
    }

    // Delete the old list
    await redis.del('invalid-messages')
  } catch (err) {
    logger.error(err)
  }
}
