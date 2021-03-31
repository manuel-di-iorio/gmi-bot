import { Task } from '../../lib/Queue'
import { buildLogAttachment } from '../../lib/MessageStore'

export default {
  cmd: 'log',

  handler: async ({ message, text, reply }: Task) => {
    if (!message.guild) return reply(`Scusa ${message.author.username} ma questo comando non è disponibile qui.`)

    // Get the input
    const log = await buildLogAttachment(message.channel.id, 'log.txt')
    if (!log) {
      return reply('non ci sono ancora messaggi registrati in questo canale')
    }
    const resp = '**Ultimi messaggi di questo canale:**'
    await message.channel.send(resp, log.attachment)
  }
}
