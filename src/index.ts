import logger from './lib/Logger'
import { start as startRedis } from './lib/Redis'
import { start as startWorkers } from './lib/WorkerThread'
import { start as startQueue } from './lib/Queue'
import { start as startScheduler } from './lib/Scheduler'
import { start as startBot } from './lib/Discord'
import { start as startReadForumUpdates } from './lib/ReadForumUpdates'

(async () => {
  try {
    await Promise.all([
      startBot(),
      startRedis(),
      startWorkers(),
      startQueue(),
      startScheduler(),
      startReadForumUpdates()
    ])
  } catch (err) {
    logger.error(err)
  }
})()
