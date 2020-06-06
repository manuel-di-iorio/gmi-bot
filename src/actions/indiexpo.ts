import { Task } from '../lib/Queue'
import async from 'async'
import { redis } from '../lib/Redis'
import logger from '../lib/Logger'
import { DOUBLE_NEWLINE, NEWLINE } from '../lib/utils/GetNewline'

export default {
  resolver: (text: string) => text === 'bot:users:gems',

  handler: async ({ reply, message }: Task) => {
    // Get all the users
    const usersIds = await redis.keys('u:*')
    let users = []

    // Get the gems
    let gemsCount = 0
    let gemsTotalCount = 0

    const tasks = []
    usersIds.forEach(userIdKey => {
      tasks.push(async () => {
        const gems = await redis.hget(userIdKey, 'indiexpo-gems')
        if (gems) {
          const gemsNum = parseInt(gems)
          gemsCount += gemsNum
          users.push({ id: userIdKey.slice(2), gems: gemsNum })
        }
      })

      tasks.push(async () => {
        const gems = await redis.hget(userIdKey, 'indiexpo-gems-total')
        if (gems) gemsTotalCount += parseInt(gems)
      })
    })
    await async.parallelLimit(tasks, 20)

    // Sort the users by most gems
    users = users.sort((a, b) => (b.gems - a.gems))

    // Get the users leaderboard
    let usersLeaderboard = ''

    if (message.guild) {
      usersLeaderboard += `**Utenti con più gemme:**${NEWLINE}\`\`\``

      for (let i = 0; i < Math.min(10, users.length); i++) {
        const user = users[i]
        const userCache = message.guild.members.cache.get(user.id)
        if (!userCache) continue
        usersLeaderboard += `${i + 1}) ${userCache.displayName}: ${user.gems + NEWLINE}`
      }

      usersLeaderboard += '```'
    }

    // Send the message
    message.delete().catch((err: Error) => logger.error(err))
    await reply(`gli utenti hanno guadagnato questo mese **${gemsCount}** <:expo:714886068041941002> e in totale **${gemsTotalCount}** <:expo:714886068041941002>${DOUBLE_NEWLINE + usersLeaderboard}`)
  }
}
