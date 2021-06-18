import { CommandInteraction } from 'discord.js'
import { InteractionConfig } from '../types'

export const logoInteraction: InteractionConfig = {
  interaction: {
    name: 'logo',
    description: 'Mostra il logo del server'
  },

  handler: async (message: CommandInteraction) => {
    await message.reply(message.guild.iconURL({ format: 'png', size: 512 }))
  }
}
