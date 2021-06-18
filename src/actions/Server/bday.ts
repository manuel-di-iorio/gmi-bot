import moment from 'moment'
import { Task } from '../../lib/Queue'
import { redis } from '../../lib/Redis'
import { NEWLINE } from '../../lib/utils/GetNewline'
import { MessageEmbed, Snowflake } from 'discord.js'
import { getUserDisplayName } from '../../lib/utils/GetUserDisplayName'
import { BOT_COLOR } from '../../lib/Config'

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
  cmd: 'bday',

  handler: async ({ reply, message, text }: Task) => {
    // Guild check
    if (!message.guild) return reply(`Scusa ${message.author.username} ma questo comando non è disponibile qui.`)

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
      let bdayTextArticle = 'il '

      if (bday) {
        // Get the clean date and the user age
        const bdayMoment = moment(bday, 'DD/MM/YYYY')
        bdayClean = bdayMoment.format('D MMMM')
        bdayYears = currentYear - parseInt(bdayMoment.format('YYYY'))

        // Check if the user bday is past
        const nowMoment = moment().tz('Europe/Rome')
        const bdayCurrentMoment = moment(bdayClean, 'DD MMMM')
        isBdayPast = bdayCurrentMoment.isSameOrBefore(nowMoment)

        // Get the bday text article
        const bdayDate = parseInt(bdayMoment.format('D'))
        if (bdayDate === 1 || bdayDate === 8 || bdayDate === 11) bdayTextArticle = "l'"
      }

      if (mentionId === authorId) {
        if (!bday) return reply(`non hai impostato il tuo compleanno! ${noBdaySetHint}`)
        return reply(`il tuo compleanno è ${bdayTextArticle}${bdayClean}, ${isBdayPast ? 'hai compiuto' : 'compierai'} ${bdayYears} anni!`)
      } else {
        if (!bday) return reply(`${mentionUser.displayName} non ha indicato il compleanno`)
        return reply(`il compleanno di ${mentionUser.displayName} è ${bdayTextArticle}${bdayClean}, ${isBdayPast ? 'ha compiuto' : 'compierà'} ${bdayYears} anni!`)
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
      const embed = new MessageEmbed().setColor(BOT_COLOR)
      if (message.guild) embed.setAuthor('Birthdays | GameMaker Italia', message.guild.iconURL())

      embed
        .setDescription('⚠️ __Non mettere `<>` o `[]` intorno ai parametri.__')
        .setFooter(`!bday richiesto da ${getUserDisplayName(message)}`, message.author.displayAvatarURL())

      embed.addField('Comandi:', `\`!bday DD/MM/YYYY\` - Setta il tuo compleanno (giorno/mese/anno)
\`!bday remove\` - Rimuove il tuo compleanno
\`!bday <@user>\` - Mostra il compleanno di un altro utente`, false)

      return await message.channel.send({ embeds: [embed] })
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

    let bdayTextArticle = 'il '
    const bdayDate = parseInt(userBDayMoment.format('D'))
    if (bdayDate === 1 || bdayDate === 8 || bdayDate === 11) bdayTextArticle = "l'"
    await reply(`ho salvato il tuo compleanno e lo annuncerò ${bdayTextArticle}${userBDayMoment.format('D MMMM')}!`)
  }
}
