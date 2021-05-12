import logger from './lib/Logger'
import { start as startRedis } from './lib/Redis'
import { start as startWorkers } from './lib/WorkerThread'
import { start as startQueue } from './lib/Queue'
import { start as startScheduler } from './lib/Scheduler'
import { start as startBot } from './lib/Discord'
import { init as initSpellcheck } from './lib/Spellcheck'
import { start as startPuppeteer } from './lib/Puppeteer'
import { actions } from './actions'
import { startEmoteStatsRendering } from './interactions/Server/emote'

(async () => {
  initSpellcheck(actions)

  try {
    await Promise.all([
      startBot(),
      startRedis(),
      startWorkers(),
      startQueue(),
      startPuppeteer()
    ])

    await Promise.all([
      startScheduler(),
      startEmoteStatsRendering()
    ])
  } catch (err) {
    logger.error(err)
  }
})()
