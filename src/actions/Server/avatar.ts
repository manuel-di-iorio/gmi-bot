import { MessageAttachment } from 'discord.js'
import { Task } from '../../lib/Queue'

export default {
  resolver: (text: string) => text.startsWith('avatar'),

  handler: async ({ message }: Task) => {
    const avatar = message.mentions.users.first()?.displayAvatarURL({ dynamic: true, size: 512 }) ||
      message.author.displayAvatarURL({ dynamic: true, size: 512 })

    const attachment = new MessageAttachment(avatar.replace('.webp', '.png'))
    await message.channel.send(attachment)
  }
}
