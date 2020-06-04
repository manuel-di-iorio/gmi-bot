import { Message } from 'discord.js'
import logger from '../Logger'

interface AskOptions {
  text: string;
  time?: number;
}

/**
 * Ask a reply message for an action
 */
export const askMsgReply = async (message: Message, { text, time }: AskOptions): Promise<string | undefined> => {
  if (!time) time = 20000
  const { id: authorId } = message.author

  const askReply = await message.reply(text + '  (Annulla con !cancel)')

  const filter = (m: Message) => m.author.id === authorId
  const collected = await message.channel.awaitMessages(filter, { max: 1, time: 20000 })

  // If the user has not replied
  if (!collected.size) {
    if (message.guild) {
      message.channel.bulkDelete([message, askReply])
        .catch((err: Error) => logger.error(err))
    }
    return
  }

  // Get the user reply
  const collectedMsg = collected.first()
  const userReply = collectedMsg.content

  if (message.guild) {
    message.channel.bulkDelete([collectedMsg, message, askReply])
      .catch((err: Error) => logger.error(err))
  }

  if (userReply === '!cancel') return
  return userReply
}
