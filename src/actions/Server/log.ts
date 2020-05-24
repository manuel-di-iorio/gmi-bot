import { Task } from '../../lib/Queue'
import { getMessages } from '../../lib/MessageStore'
import { MessageAttachment } from 'discord.js'
import { NEWLINE } from '../../lib/utils/GetNewline'

export default {
  resolver: (text: string) => text.startsWith('log'),

  handler: async ({ message, text, reply }: Task) => {
    if (!message.guild) return reply(`Scusa ${message.author.username} ma questo comando non è disponibile qui`)

    // Get the input
    const input = text.replace('log', '').trim()
    const maxInlineMsg = input && !isNaN(parseInt(input)) ? Math.max(1, Math.min(11, parseInt(input + 1))) : 6

    // Get a copy of the store
    const messages = await getMessages(message.channel.id)

    // Create the log
    if (!messages.length) {
      await reply('non ci sono ancora messaggi registrati in questo canale')
      return
    }

    let log = ''
    let recentMsg = ''
    for (let i = 0, len = messages.length; i < len; i++) {
      log += messages[i] + NEWLINE
      if (i > 0 && i < maxInlineMsg) recentMsg += `\`${messages[i].replace(/(\[\d+\/\d+\/\d+ )([\d:]+)(]+)/, '$2')}\`${NEWLINE}`
    }

    // Send the log
    const logBuffer = Buffer.from(log, 'utf8')
    // const userNameClean = getUserDisplayName(message).replace(/\s+/g, '').replace(/[^0-9a-z_-]+/gi, '-')
    const attachment = new MessageAttachment(logBuffer, 'log.txt')
    const resp = `**Ultimi messaggi di questo canale:**${NEWLINE + recentMsg + NEWLINE}!log richiesto da ${message.author}`

    await Promise.all([
      message.delete(),
      message.channel.send(resp, attachment)
    ])
  }
}
