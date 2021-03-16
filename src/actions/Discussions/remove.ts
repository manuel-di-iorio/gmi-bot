import { Task } from '../../lib/Queue'
import * as Discussion from '../../models/Discussion'

export default {
  cmd: 'channel remove',

  handler: async ({ message, reply }: Task) => {
    if (!message.guild) return reply(`Scusa ${message.author.username} ma questo comando non è disponibile qui.`)

    // Get the user channel
    const userId = message.author.id
    const discussion = await Discussion.getByUser(userId)
    if (!discussion) return reply('non hai creato un canale temporaneo')

    const channel = message.guild.channels.cache.get(discussion.id)

    // Remove the channel
    await Promise.all([
      Discussion.remove(userId),
      channel && channel.delete()
    ])

    await reply('il canale temporaneo è stato cancellato')
  }
}
