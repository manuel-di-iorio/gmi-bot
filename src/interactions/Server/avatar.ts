import { CommandInteraction } from 'discord.js'
import { InteractionConfig } from '../types'

export const avatarInteraction: InteractionConfig = {
  interaction: {
    name: 'avatar',
    description: 'Mostra l\'avatar dell\'utente',
    options: [{
      name: 'user',
      type: 'USER',
      description: 'Utente di cui mostrare l\'avatar'
    }]
  },

  handler: async (message: CommandInteraction) => {
    const user = !message.options.data.length ? message.user : message.options.data[0].user
    await message.reply(user.displayAvatarURL({ format: 'png', size: 512 }))
  }
}
