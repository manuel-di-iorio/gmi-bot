import { Task } from '../../lib/Queue'
import * as Discussion from '../../models/Discussion'

export default {
  cmd: 'channel rename',

  handler: async ({ message, text, reply }: Task) => {
    if (!message.guild) return reply(`Scusa ${message.author.username} ma questo comando non è disponibile qui.`)

    const input = text.replace('channel rename', '')

    if (!input) {
      return reply('inserisci il nuovo nome del canale temporaneo')
    }

    // Get the user channel
    const userId = message.author.id
    const discussion = await Discussion.getByUser(userId)
    if (!discussion) return reply('non hai creato un canale temporaneo')

    const channel = message.guild.channels.cache.get(discussion.id)
    if (!channel) {
      await Discussion.remove(userId)
      return reply('il canale temporaneo è stato cancellato manualmente')
    }

    await channel.setName(input)
    await reply('il nome del canale temporaneo è stato modificato')
  }
}
