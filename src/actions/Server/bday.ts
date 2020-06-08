import moment from 'moment'
import { Task } from '../../lib/Queue'
import { redis } from '../../lib/Redis'
import { NEWLINE } from '../../lib/utils/GetNewline'
import { MessageEmbed, Snowflake } from 'discord.js'
import { getUserDisplayName } from '../../lib/utils/GetUserDisplayName'
import logger from '../../lib/Logger'

const noBdaySetHint = `Puoi scrivere \`!bday DD/MM/YYYY\`${NEWLINE}Esempio: \`!bday 25/12/2001\` (giorno/mese/anno)`

/** Remove the user bday */
const removeUserBday = async (authorId: Snowflake) => {
  // Get the user full bday
  const userBDay = await redis.hget(`u:${authorId}`, 'bday')
  if (!userBDay) return false

  // Find the user bday in the bdays list
  const userBDayYear = userBDay.slice(userBDay.lastIndexOf('/') + 1)
  const userPartialDate = userBDay.slice(0, userBDay.lastIndexOf('/'))
  const userBDayList = await redis.lrange(`bdays:${userPartialDate}`, 0, -1)
  const userBDayListIndex = userBDayList.find(userId => userId === `${authorId}-${userBDayYear}`)
  if (!userBDayListIndex) return false

  // Unset the user bday
  await Promise.all([
    redis.hdel(`u:${authorId}`, 'bday'),
    redis.lrem(`bdays:${userPartialDate}`, 1, userBDayListIndex)
  ])
  return true
}

export default {
  resolver: (text: string) => text.startsWith('bday'),

  handler: async ({ reply, message, text }: Task) => {
    // Guild check
    if (!message.guild) return reply(`Scusa ${message.author.username} ma questo comando non è disponibile qui`)

    const authorId = message.author.id
    const currentYear = new Date().getFullYear()

    // Check if the user wants to see the bday of another user
    if (message.mentions.members.size) {
      const mentionUser = message.mentions.members.first()
      const mentionId = mentionUser.id

      const bday = await redis.hget(`u:${mentionId}`, 'bday')
      let bdayClean: string
      let bdayYears: number
      let isBdayPast: boolean

      if (bday) {
        // Get the clean date and the user age
        const bdayMoment = moment(bday, 'DD/MM/YYYY')
        bdayClean = bdayMoment.format('D MMMM')
        bdayYears = currentYear - parseInt(bdayMoment.format('YYYY'))

        // Check if the user bday is past
        const nowMoment = moment().tz('Europe/Rome')
        const bdayCurrentMoment = moment(bdayClean, 'DD MMMM')
        isBdayPast = bdayCurrentMoment.isSameOrBefore(nowMoment)
      }

      if (mentionId === authorId) {
        if (!bday) return reply(`non hai impostato il tuo compleanno! ${noBdaySetHint}`)
        return reply(`il tuo compleanno è il ${bdayClean}, ${isBdayPast ? 'hai compiuto' : 'compierai'} ${bdayYears} anni!`)
      } else {
        if (!bday) return reply('questo utente non ha indicato il compleanno')
        return reply(`il compleanno di ${mentionUser.displayName} è il ${bdayClean}, ${isBdayPast ? 'ha compiuto' : 'compierà'} ${bdayYears} anni!`)
      }
    }

    // Else, set/unset the user bday
    const input = text.replace('bday', '').trim().toLowerCase()

    // Unset the bday if specified
    if (input === 'remove') {
      return (await removeUserBday(authorId))
        ? reply('ho rimosso il tuo compleanno.')
        : reply(`non hai ancora impostato il tuo compleanno. ${noBdaySetHint}`)
    }

    // Get the input
    if (!input) {
      message.delete().catch((err: Error) => logger.error(err))

      const embed = new MessageEmbed().setColor('#a5c0d6')
      if (message.guild) embed.setAuthor('Birthdays | GameMaker Italia', message.guild.iconURL())

      embed
        .setDescription('⚠️ __Non mettere `<>` o `[]` intorno ai parametri.__')
        .setFooter(`!bday richiesto da ${getUserDisplayName(message)}`, message.author.displayAvatarURL())

      embed.addField('Comandi:', `\`!bday DD/MM/YYYY\` - Setta il tuo compleanno (giorno/mese/anno)
\`!bday remove\` - Rimuove il tuo compleanno
\`!bday <@user>\` - Mostra il compleanno di un altro utente`, false)

      return await message.channel.send(embed)
    }

    // Input validation
    const userBDayMoment = moment(input, 'DD/MM/YYYY', true)
    if (!userBDayMoment.isValid()) {
      return reply(`la data non è valida. ${noBdaySetHint}`)
    }

    // Remove the current stored user bday
    await removeUserBday(authorId)

    // Set the new user bday
    const userBDayYear = input.slice(input.lastIndexOf('/') + 1)
    const userBDayPartialDate = input.slice(0, input.lastIndexOf('/'))

    await Promise.all([
      redis.hset(`u:${authorId}`, 'bday', input),
      redis.lpush(`bdays:${userBDayPartialDate}`, `${authorId}-${userBDayYear}`)
    ])

    await reply(`ho salvato il tuo compleanno e lo annuncerò il ${userBDayMoment.format('D MMMM')}!`)
  }
}
