import { Task } from '../../lib/Queue'
import { buildLogAttachment } from '../../lib/MessageStore'

export default {
  cmd: 'log',

  handler: async ({ message, text, reply }: Task) => {
    if (!message.guild) return reply(`Scusa ${message.author.username} ma questo comando non è disponibile qui.`)

    // Get the input
    const input = text.replace('log', '').trim()
    const maxInlineMsg = input && !isNaN(parseInt(input)) ? Math.max(1, Math.min(10, parseInt(input + 1))) : 7

    const log = await buildLogAttachment(message.channel.id, 'log.txt', maxInlineMsg)
    if (!log) {
      return reply('non ci sono ancora messaggi registrati in questo canale')
    }
    const resp = `**Ultimi messaggi di questo canale:**${log.recentMsg}`
    await message.channel.send(resp, log.attachment)
  }
}
