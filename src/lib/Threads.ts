import { Message } from 'discord.js'
import { GMI_QUESTIONS_CH_ID } from './Config'
import logger from './Logger'

export const createQuestionThreads = async (message: Message) => {
  if (message.channel.id !== GMI_QUESTIONS_CH_ID) return
  if (message.hasThread) return

  try {
    await message.startThread({
      name: message.content.slice(0, 99),
      autoArchiveDuration: 1440
    })
  } catch (e) {
    logger.error(e)
  }
}
