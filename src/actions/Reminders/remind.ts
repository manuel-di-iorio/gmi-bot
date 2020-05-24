import crypto from 'crypto'
import moment from 'moment'
import { Task } from '../../lib/Queue'
import { parseNaturalDate } from '../../lib/ParseNaturalDate'
import { redis } from '../../lib/Redis'
import logger from '../../lib/Logger'
import { askMsgReply } from '../../lib/AskMsgReply'

export default {
  resolver: (text: string) => text.startsWith('remind'),

  handler: async ({ message, reply, text }: Task) => {
    let input = text.replace('remind', '')

    // Get the mentioned channel
    const channel = message.mentions.channels.size ? message.mentions.channels.first() : message.channel
    const channelId = channel.id
    if (message.mentions.channels.size) {
      input = input.replace(new RegExp(`<#${channelId}>`), '')
    }

    if (!input || !input.startsWith(' ') || input.startsWith(' |')) {
      return reply(`specifica il messaggio da ricordare e quando farlo, separati da virgola. 
Se tagghi un canale, il messaggio verrà inviato lì.
      
Esempi:
\`!remind Partita di calcetto | domani alle 16\` 
\`!remind è uscito il mio nuovo gioco su Steam!\` (puoi omettere la data, te la chiederò subito dopo)
\`!remind Stream di Jak | tra trenta minuti\`
\`!remind #generale 15e18 quanto fa ?\``)
    }

    input = input.trim()

    if (!input) {
      return reply('inserisci un messaggio da inviare nel reminder. Remind annullato')
    }

    let remindMsg: string = input
    let remindWhen: string

    if (input.includes('|')) {
      const commaPos = input.lastIndexOf('|')
      remindMsg = input.substr(0, commaPos).trim()
      remindWhen = input.substr(commaPos + 1).trim()
    }

    // Ask the date if it is not specified from the user
    if (!remindWhen) {
      remindWhen = await askMsgReply(message, { text: 'quando devo ricordartelo ?' })
      if (!remindWhen) return
    }

    // Parse the date
    const remindDate = parseNaturalDate(remindWhen)
    if (!remindDate) {
      return reply('non ho capito la data. Remind annullato')
    }

    const now = Date.now()
    const remindDateTime = remindDate.getTime()
    if (remindDateTime - now < 5e4 /* 50 secs */ || remindDateTime < now) {
      return reply('deve passare almeno un minuto per il reminder. Remind annullato')
    } else if (remindDateTime - now > 31536e6 * 3 /* 3 years */) {
      return reply('il massimo è 3 anni. Remind annullato')
    }

    // Save the reminder
    const reminderId = crypto.randomBytes(10).toString('hex')

    if (message.guild) message.delete().catch((err: Error) => logger.error(err))

    await redis.hset('reminders', reminderId, JSON.stringify({
      msg: remindMsg,
      exp: remindDate,
      chn: channelId,
      usr: message.author.id
    }))

    // Tell the user of the success operation
    const prettyDate = moment(remindDate).format('DD/MM/YYYY [alle] HH:mm:ss')
    await message.channel.send(`Ok ${message.author}, ti ricorderò **${remindMsg}** nel canale ${channel} il ${prettyDate}`)
  }
}
