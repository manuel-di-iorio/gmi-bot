import { Message } from 'discord.js'
import { GMI_LIMITED_CHS_LINK_OR_IMG, GMI_LIMITED_CHS_LIMIT_LINK } from './Config'
import logger from './Logger'

const linkChs = GMI_LIMITED_CHS_LIMIT_LINK.split(',')
const linkImgChs = GMI_LIMITED_CHS_LINK_OR_IMG.split(',')

const linkRegex = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/

export const deleteInvalidMsgInLimitedChannels = (message: Message, content: string): Promise<null> => {
  const { id: channelId } = message.channel

  // Check link channels
  if (linkChs.includes(channelId)) {
    const channel = message.guild.channels.cache.get(channelId)

    if (!linkRegex.test(content)) {
      // Delete the message
      message.delete().catch((err: Error) => logger.error(err))

      // Send a pm to the user with the delete explanation
      const contentText = content ? `'${content}' ` : ''

      message.author.send(`Ciao ${message.author.username}, il tuo messaggio ${contentText}inviato nel canale #${channel.name} è stato cancellato automaticamente poichè non include un link`)
        .catch((err: Error) => logger.error(err))
    }
  } else if (linkImgChs.includes(channelId)) {
    // Check link&img channels
    const channel = message.guild.channels.cache.get(channelId)

    if (!linkRegex.test(content) && !message.attachments.size) {
      // Delete the message
      message.delete().catch((err: Error) => logger.error(err))

      // Send a pm to the user with the delete explanation
      const contentText = content ? `'${content}' ` : ''

      message.author.send(`Ciao ${message.author.username}, il tuo messaggio ${contentText}inviato nel canale #${channel.name} è stato cancellato automaticamente poichè non include un link o un'immagine`)
        .catch((err: Error) => logger.error(err))
    }
  }

  return null
}
