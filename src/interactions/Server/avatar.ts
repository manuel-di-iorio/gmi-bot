import { ApplicationCommandOptionType } from 'discord-api-types'
import { CommandInteraction } from 'discord.js'
import { InteractionConfig } from '../types'

export const avatarInteraction: InteractionConfig = {
  interaction: {
    name: 'avatar',
    description: 'Mostra l\'avatar dell\'utente',
    options: [{
      name: 'user',
      type: ApplicationCommandOptionType.USER,
      description: 'Utente di cui mostrare l\'avatar'
    }]
  },

  handler: async (message: CommandInteraction) => {
    const user = !message.options.size ? message.user : message.options.first().user
    await message.reply(user.displayAvatarURL({ format: 'png', size: 512 }))
  }
}
