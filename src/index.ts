import logger from './lib/Logger'
import { start as startRedis } from './lib/Redis'
import { start as startWorkers } from './lib/WorkerThread'
import { start as startQueue } from './lib/Queue'
import { start as startScheduler } from './lib/Scheduler'
import { start as startRemindersScheduler } from './lib/RemindersScheduler'
import { start as startBot } from './lib/Discord'
import { init as initSpellcheck } from './lib/Spellcheck'
import { startEmoteStatsRendering } from './actions/Server/emotes'
import { actions } from './actions'
// import { start as startReadForumUpdates } from './lib/ReadForumUpdates'

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
      // startReadForumUpdates()
      startScheduler(),
      startRemindersScheduler(),
      startEmoteStatsRendering()
    ])
  } catch (err) {
    logger.error(err)
  }
})()
