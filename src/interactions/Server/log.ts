import { CommandInteraction } from 'discord.js'
import { buildLogAttachment } from '../../lib/MessageStore'

export const logInteraction = {
  version: 0,
  oldVersion: 0,

  interaction: {
    name: 'log',
    description: 'Mostra gli ultimi messaggi di questo canale'
  },

  handler: async (message: CommandInteraction) => {
    await message.defer()
    const log = await buildLogAttachment(message.channel.id, 'log.txt')
    if (!log) {
      return message.reply('non ci sono ancora messaggi registrati in questo canale')
    }
    // @ts-expect-error
    await message.editReply('**Ultimi messaggi di questo canale:**', log.attachment)
  }
}
