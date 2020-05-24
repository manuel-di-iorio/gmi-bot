import { MessageAttachment } from 'discord.js'
import { Task } from '../../lib/Queue'

export default {
  resolver: (text: string) => text === 'logo',

  handler: async ({ message, reply }: Task) => {
    if (!message.guild) return reply(`Scusa ${message.author.username} ma questo comando non è disponibile qui`)

    const icon = message.guild.iconURL({ dynamic: true, size: 512 })
    const attachment = new MessageAttachment(icon.replace('.webp', '.png'))
    await message.channel.send(attachment)
  }
}
