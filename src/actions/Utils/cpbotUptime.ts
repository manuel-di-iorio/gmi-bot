import { Task } from '../../lib/Queue'
import { redis } from '../../lib/Redis'

export default {
  cmd: 'bot:cpbot:uptime',

  handler: async ({ reply }: Task) => {
    const [success, failed] = await redis.hmget('cpbot', 'uptime-success', 'uptime-failed')
    const successValue = parseInt(success || '0')
    const failedValue = parseInt(failed || '0')
    let uptime = 100 - 100 / (successValue + failedValue) * failedValue
    if (uptime === Infinity || isNaN(uptime)) uptime = 0

    const offlineMin = failedValue * 5
    return reply(`uptime cpbot: ${uptime.toFixed(3)}% (afk totale ~${Math.floor(offlineMin / 60)}h ${offlineMin % 60}m)`)
  }
}
