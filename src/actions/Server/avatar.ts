// import { MessageAttachment } from 'discord.js'
import { Task } from '../../lib/Queue'

export default {
  resolver: (text: string) => text.startsWith('avatar'),

  handler: async ({ message }: Task) => {
    const avatar = message.mentions.users.first()?.displayAvatarURL({ format: 'png', size: 512 }) ||
      message.author.displayAvatarURL({ format: 'png', size: 512 })

    await message.channel.send(avatar)
  }
}
