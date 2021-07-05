import logger from './lib/Logger'
import { start as startRedis } from './lib/Redis'
import { start as startWorkers } from './lib/WorkerThread'
import { start as startQueue } from './lib/Queue'
import { start as startScheduler } from './lib/Scheduler'
import { start as startBot } from './lib/Discord'
import { init as initSpellcheck } from './lib/Spellcheck'
import { start as startTwitch } from './lib/Twitch'
import { start as startEventCountdown } from './lib/EventCountdown'
import { actions } from './actions'
import { startEmoteStatsRendering } from './interactions/Server/emote'

(async () => {
  initSpellcheck(actions)

  try {
    await Promise.all([
      startBot(),
      startRedis(),
      startWorkers(),
      startQueue()
    ])

    await Promise.all([
      startScheduler(),
      startEmoteStatsRendering(),
      startTwitch(),
      startEventCountdown()
    ])
  } catch (err) {
    logger.error(err)
  }
})()
