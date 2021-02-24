import crypto from 'crypto'
import moment from 'moment'
import { Task } from '../../lib/Queue'
import { parseNaturalDate } from '../../lib/utils/ParseNaturalDate'
import { redis } from '../../lib/Redis'
import logger from '../../lib/Logger'
import { askMsgReply } from '../../lib/utils/AskMsgReply'
import { MessageEmbed } from 'discord.js'
import { getUserDisplayName } from '../../lib/utils/GetUserDisplayName'

export default {
  cmd: 'remind',

  handler: async ({ message, reply, text }: Task) => {
    let input = text.replace('remind', '')

    // Get the mentioned channel
    const channel = message.mentions.channels.size ? message.mentions.channels.first() : message.channel
    const channelId = channel.id
    if (message.mentions.channels.size) {
      input = input.replace(new RegExp(`<#${channelId}>`), '')
    }

    if (!input || !input.startsWith(' ') || input.startsWith(' |')) {
      const embed = new MessageEmbed().setColor('#b959b6')
      if (message.guild) embed.setAuthor('Reminders | GameMaker Italia', message.guild.iconURL())

      embed.setFooter(`!remind richiesto da ${getUserDisplayName(message)}`, message.author.displayAvatarURL())

        .setDescription('Crea un reminder con un messaggio da ricordare quando vuoi. Se tagghi un canale, il messaggio verrà inviato lì.')

        .addField('Comandi:', `\`!remind <messaggio> | <quando> \` - Setta un reminder
  \`!remind list\` - Mostra tutti i reminders
\`!remind remove <id>\` - Cancella un reminder`, false)

        .addField('Esempi:', `\`!remind Partita alle 8 e mezza di sera | 20:30\`
\`!remind Gioco gratis | 21:00:00 05/12\`
\`!remind Viaggio GMI | 01/08/2023\`
\`!remind Partita di calcetto | domani alle 16\``, false)

      return message.channel.send(embed)
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
    let remindDate = new Date(moment(remindWhen, [
      'H', 'HH', 'H:mm', 'HH:mm', 'H:mm:ss', 'HH:mm:ss', 'DD/MM',
      'H:mm:ss D', 'HH:mm:ss D', 'HH:mm:ss DD',
      'H:mm:ss DD/MM', 'HH:mm:ss DD/MM', 'HH:mm:ss DD/M',
      'H:mm:ss DD/MM/YYYY', 'H:mm:ss D/MM/YYYY', 'HH:mm:ss D/MM/YYYY', 'HH:mm:ss DD/MM/YYYY',
      'HH:mm:ss DD/M/YYYY', 'H:mm:ss DD/M/YYYY', 'H:mm:ss D/M/YYYY', 'HH:mm:ss D/M/YYYY',
      'D/MM/YYYY', 'D/M/YYYY', 'DD/MM/YYYY'
    ], true).valueOf())

    if (!(remindDate instanceof Date) || isNaN(+remindDate)) {
      remindDate = parseNaturalDate(remindWhen)
    }

    if (!remindDate) return reply('non ho capito la data. Remind annullato')

    // Ask AM/PM time if needed
    const today = new Date()

    // Date check
    const todayTimestamp = today.getTime()
    const remindDateTime = remindDate.getTime()
    if (remindDateTime < todayTimestamp) {
      return reply('la data del reminder deve essere nel futuro. Remind annullato')
    } else if (remindDateTime - todayTimestamp > 31536e6 * 10 /* 10 years */) {
      return reply('il massimo è 10 anni. Remind annullato')
    }

    // Save the reminder
    const reminderId = crypto.randomBytes(10).toString('hex')

    if (message.guild && !message.deleted) {
      message.delete().catch((err: Error) => logger.error(err, 'Remind > Deleting the input message'))
    }

    await redis.hset('reminders', reminderId, JSON.stringify({
      msg: remindMsg,
      exp: remindDate,
      chn: channelId,
      usr: message.author.id
    }))

    // Tell the user of the success operation
    const prettyDate = moment(remindDate).format('DD MMMM YYYY [alle] HH:mm:ss')
    return reply(`ti ricorderò ** ${remindMsg} ** nel canale ${channel} il ${prettyDate}`)
  }
}
