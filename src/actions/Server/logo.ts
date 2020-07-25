import { Task } from '../../lib/Queue'

export default {
  cmd: 'logo',

  handler: async ({ message, reply }: Task) => {
    if (!message.guild) return reply(`Scusa ${message.author.username} ma questo comando non è disponibile qui.`)
    await message.channel.send(message.guild.iconURL({ format: 'png', size: 512 }))
  }
}
