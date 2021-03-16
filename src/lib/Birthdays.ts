import { redis } from './Redis'
import moment from 'moment'
import 'moment-timezone'
import logger from './Logger'
import { bot } from './Discord'
import { GMI_GUILD } from './Config'
import { TextChannel, Snowflake } from 'discord.js'

moment.locale('it')

export const checkBirthdays = async () => {
  const mainChannel = bot.channels.cache.get(GMI_GUILD) as TextChannel
  if (!mainChannel) return
  const guildMembers = mainChannel.guild.members.cache

  // Get the current time
  const now = moment().tz('Europe/Rome')
  const currentYear = parseInt(now.format('YYYY'))

  try {
    // Get the users birthdays
    const todayBirthdays = await redis.lrange(`bdays:${now.format('DD/MM')}`, 0, -1)
    if (!todayBirthdays || !todayBirthdays.length) return

    let users = ''
    Object.values(todayBirthdays).forEach((userKey: Snowflake, idx, array) => {
      const [userId, userBdayYear] = userKey.split('-')
      const guildMember = guildMembers.get(userId)
      if (guildMember) {
        users += `${guildMember.displayName} (${currentYear - parseInt(userBdayYear)} anni)`
        if (idx < array.length - 1) users += ', '
      }
    })

    if (!users) return

    // Send the birthday message
    await mainChannel.send(`🥳 **BUON COMPLEANNO!** 🥳
\`\`\`
Oggi è il compleanno di: ${users}
Tanti auguri!\`\`\` `)
  } catch (err) {
    logger.error(err)
  }
}
