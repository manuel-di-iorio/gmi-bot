import { Message, MessageEmbed, Snowflake } from 'discord.js'
import { BOT_COLOR, GMI_QUESTIONS_CH_ID } from './Config'
import logger from './Logger'
import { redis } from './Redis'
import { DOUBLE_NEWLINE } from './utils/GetNewline'

let helpMsgId: Snowflake

export const createQuestionThreads = async (message: Message) => {
  if (message.channel.id !== GMI_QUESTIONS_CH_ID) return
  if (message.hasThread) return

  const content = message.content.slice(0, 99)

  try {
    await message.startThread({
      name: `${content[0].toUpperCase()}${content.slice(1)}`,
      autoArchiveDuration: 1440
    })
  } catch (e) {
    logger.error(e)
  }
}

export const resendQuestionHelpMsg = async (message: Message) => {
  if (message.channel.id !== GMI_QUESTIONS_CH_ID) return

  try {
    helpMsgId ||= await redis.get('help-msg-id')
    if (helpMsgId) {
      const msg = await message.channel.messages.fetch(helpMsgId)
      if (msg) {
        msg.delete().catch((err: Error) => logger.error(err))
      }
    }
  } catch (e) {
    console.log('error')
    logger.error(e)
  }

  // Send the help embed
  const embed = new MessageEmbed()
  embed
    .setColor(BOT_COLOR)
    .setTitle('Come fare una domanda')
    .setDescription(`Scrivi il titolo della tua domanda e fai la tua domanda nel thread creato automaticamente.${DOUBLE_NEWLINE}Puoi anche usare il comando /thread`)

  try {
    const helpMsg = await message.channel.send({ embeds: [embed] })
    helpMsgId = helpMsg.id

    // Save the new help message ID
    await redis.set('help-msg-id', helpMsgId)
  } catch (e) {
    logger.error(e)
  }
}
