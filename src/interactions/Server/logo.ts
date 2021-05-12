import { CommandInteraction } from "discord.js";

export const logoInteraction = {
  version: 0,
  oldVersion: 0,

  interaction: {
    name: 'logo',
    description: 'Mostra il logo del server'
  },

  handler: async (message: CommandInteraction) => {
    await message.reply(message.guild.iconURL({ format: 'png', size: 512 }))
  }
}
