import { GuildMember } from 'discord.js'
import async from 'async'
import prettyDate from 'pretty-date'
import { GMI_GUILD } from '../../lib/Config'
import { bot } from '../../lib/Discord'
import { Task } from '../../lib/Queue'
import { redis, scanKeys } from '../../lib/Redis'
import { DOUBLE_NEWLINE, NEWLINE } from '../../lib/utils/GetNewline'
import { translateTimeToItalian } from '../../lib/utils/translateTimeToItalian'

const ONE_MONTH = 1000 * 60 * 60 * 24 * 30

interface UserStat {
  member: GuildMember,
  latestMsgDate?: Date,
  msgCount: number,
}

export default {
  cmd: 'inactive-users',

  handler: async ({ message, reply }: Task) => {
    const usersKey = await scanKeys('u:*')
    const tasks = []
    // const gmiGuildMembers = bot.guilds.cache.get(GMI_GUILD).members.cache
    const gmiGuildMembers = bot.guilds.cache.get(GMI_GUILD).members
    const now = Date.now()

    // Load the stats of all users
    for (const key of usersKey) {
      if ((key.match(/:/g) || []).length !== 1) continue

      tasks.push(async () => {
        let member: GuildMember
        let msgCount: string

        try {
          ([member, msgCount] = await Promise.all([
            // gmiGuildMembers.get(key.slice(2)),
            gmiGuildMembers.fetch(key.slice(2)),
            redis.hget(key, 'msg')
          ]))
        } catch (err) {
          if (err.code === 10007) { // UnknownMemberDiscordError
            return
          } else {
            throw err
          }
        }

        if (!member) return
        if (!member.lastMessage) {
          return {
            member,
            msgCount: 0
          }
        }

        const latestMsgDate = member.lastMessage.createdAt
        if (now - latestMsgDate.getTime() < ONE_MONTH) return

        return {
          latestMsgDate,
          msgCount: parseInt(msgCount),
          member
        }
      })
    }

    const users = await async.parallelLimit(tasks, 100) as unknown as UserStat[]

    // Build the stats text
    let stats = `\`\`\`${NEWLINE}Utenti inattivi:${DOUBLE_NEWLINE}`
    const usersListStats = []

    for (const user of users) {
      if (!user) continue
      let tempStats = ''
      tempStats += `${user.member.displayName}`
      if (user.latestMsgDate) {
        tempStats += ` - Ultimo messaggio: ${translateTimeToItalian(prettyDate.format(user.latestMsgDate))}`
      }
      tempStats += ` (Messaggi: ${user.msgCount})${NEWLINE}`
      usersListStats.push(tempStats)
    }

    if (!usersListStats.length) {
      stats += `Non ci sono utenti inattivi nell'ultimo mese${NEWLINE}\`\`\``
      await message.channel.send(stats)
    }

    // Send the stats in the paginated way
    for (let i = 0; i < usersListStats.length; i += 10) {
      const sliceArray = usersListStats.slice(i, i + 10)
      for (const userStats of sliceArray) {
        stats += userStats
      }
      await message.channel.send(stats + `${NEWLINE}\`\`\``)
      stats = `\`\`\`${NEWLINE}`
    }
  }
}
