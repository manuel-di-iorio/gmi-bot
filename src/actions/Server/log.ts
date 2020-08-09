import { Task } from '../../lib/Queue'
import { getMessages } from '../../lib/MessageStore'
import { MessageAttachment } from 'discord.js'
import { NEWLINE, INVISIBLE_CHAR } from '../../lib/utils/GetNewline'
import { DEBUG_ENABLED } from '../../lib/Config'

export default {
  cmd: 'log',

  handler: async ({ message, text, reply }: Task) => {
    if (!message.guild) return reply(`Scusa ${message.author.username} ma questo comando non è disponibile qui.`)

    // Get the input
    const input = text.replace('log', '').trim()
    const maxInlineMsg = input && !isNaN(parseInt(input)) ? Math.max(1, Math.min(10, parseInt(input + 1))) : 7

    // Get a copy of the store
    const messages = await getMessages(message.channel.id)

    // Create the log
    if (!messages.length) {
      await reply('non ci sono ancora messaggi registrati in questo canale')
      return
    }

    let log = ''
    let recentMsg = `${NEWLINE}\`\`\`md${NEWLINE}`
    for (let i = 0, len = messages.length; i < len; i++) {
      log += messages[i] + NEWLINE
      if (i < maxInlineMsg) {
        recentMsg += `- ${messages[i].replace(/(\[\d+\/\d+\/\d+ )([\d:]+)(]+)/, '$2')
          .replace('```', '\\`\\`\\`')}${NEWLINE}`
      }
    }
    recentMsg += `${NEWLINE}\`\`\``
    if (!DEBUG_ENABLED) recentMsg += INVISIBLE_CHAR

    // Send the log
    const logBuffer = Buffer.from(log, 'utf8')
    const attachment = new MessageAttachment(logBuffer, 'log.txt')
    const resp = `**Ultimi messaggi di questo canale:**${recentMsg}`

    await message.channel.send(resp, attachment)
  }
}
