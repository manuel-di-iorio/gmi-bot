import Queue from 'bull'
import { REDIS_URL, NODE_ENV } from './Config'
import { resetUsersMonthlyGems } from './AssignIndiexpoGems'
import logger from './Logger'
import { checkBirthdays } from './Birthdays'

// Get the redis connection info
let REDIS_HOST: string
let REDIS_PORT: number
let REDIS_PASSWORD = ''

if (NODE_ENV === 'production') {
  const url = REDIS_URL.split(':')
  url.splice(0, 2)
  const redisAuth = url.shift().split('@')
  REDIS_PASSWORD = redisAuth.shift()
  REDIS_HOST = redisAuth.shift()
  REDIS_PORT = parseInt(url.shift())
} else {
  REDIS_HOST = 'localhost'
  REDIS_PORT = 6379
}

export const start = async () => {
  // Create the queue
  const queue = new Queue('scheduler', {
    redis: {
      port: REDIS_PORT,
      host: REDIS_HOST,
      password: REDIS_PASSWORD
    }
  })

  // Process the queue
  queue.process('reset-users-gems', resetUsersMonthlyGems)
  queue.process('birthday', checkBirthdays)

  // Add the jobs if they are not scheduled yet

  /* Indiexpo */
  const indiexpoResetJob = await queue.getJob('reset-users-gems')
  if (!indiexpoResetJob) {
    queue.add('reset-users-gems', null, {
      removeOnComplete: true,
      attempts: 3,
      repeat: {
        tz: 'Europe/Rome',
        cron: '0 0 1 * *'
      }
    })
  }

  /* Birthday */
  const birthdayJob = await queue.getJob('birthday')
  if (!birthdayJob) {
    queue.add('birthday', null, {
      removeOnComplete: true,
      attempts: 3,
      repeat: {
        tz: 'Europe/Rome',
        cron: '1 0 * * *'
      }
    })
  }

  logger.info('[SCHEDULER] Ready')
}
