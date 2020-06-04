import { Task } from '../lib/Queue'
import async from 'async'
import { redis } from '../lib/Redis'
import logger from '../lib/Logger'

export default {
  resolver: (text: string) => text === 'bot:users:gems',

  handler: async ({ reply, message }: Task) => {
    // Get all the users
    const users = await redis.keys('u:*')

    // Get the gems
    let gemsCount = 0
    let gemsTotalCount = 0

    const tasks = []
    users.forEach(user => {
      tasks.push(async () => {
        const gems = await redis.hget(user, 'indiexpo-gems')
        if (gems) gemsCount += parseInt(gems)
      })

      tasks.push(async () => {
        const gems = await redis.hget(user, 'indiexpo-gems-total')
        if (gems) gemsTotalCount += parseInt(gems)
      })
    })
    await async.parallelLimit(tasks, 20)

    message.delete().catch((err: Error) => logger.error(err))

    await reply(`gli utenti hanno guadagnato questo mese **${gemsCount}** <:expo:714886068041941002> e in totale **${gemsTotalCount}** <:expo:714886068041941002>`)
  }
}
