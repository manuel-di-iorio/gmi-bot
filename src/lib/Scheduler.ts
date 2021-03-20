import Queue from 'bull'
import { REDIS_URL, NODE_ENV, BACKUP_FREQUENCY, DB_CONTROL_FREQUENCY } from './Config'
import logger from './Logger'
import { checkBirthdays } from './Birthdays'
import { execBackup, dbControl } from './Backup'
import { deleteInvalidMsg } from './DeleteInvalidMsgInLimitedChannels'
import { sendReminders } from './Reminders'
import { deleteOldDiscussionChannels, updateDiscussionChannelsTopicExpiration } from './DiscussionChannels'

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
  queue.process('birthday', checkBirthdays)
  queue.process('backup', execBackup)
  queue.process('dbcontrol', dbControl)
  queue.process('deleteInvalidMsg', deleteInvalidMsg)
  queue.process('sendReminders', sendReminders)
  queue.process('deleteOldDiscussionChannels', deleteOldDiscussionChannels)
  queue.process('updateDiscussionChannelsTopicExpiration', updateDiscussionChannelsTopicExpiration)

  // Add the jobs if they are not scheduled yet

  /* Birthday */
  const birthdayJob = await queue.getJob('birthday')
  if (!birthdayJob) {
    queue.add('birthday', null, {
      removeOnComplete: true,
      attempts: 3,
      repeat: {
        tz: 'Europe/Rome',
        cron: '0 0 * * *'
      }
    })
  }

  /* DB Backups */
  const backupJob = await queue.getJob('backup')
  if (!backupJob) {
    queue.add('backup', null, {
      removeOnComplete: true,
      attempts: 3,
      repeat: {
        tz: 'Europe/Rome',
        cron: BACKUP_FREQUENCY
      }
    })
  }

  /* DB Control */
  const dbControlJob = await queue.getJob('dbcontrol')
  if (!dbControlJob) {
    queue.add('dbcontrol', null, {
      removeOnComplete: true,
      attempts: 3,
      repeat: {
        tz: 'Europe/Rome',
        cron: DB_CONTROL_FREQUENCY
      }
    })
  }

  /* Delete invalid messages sent in limited channels */
  const deleteInvalidMsgJob = await queue.getJob('deleteInvalidMsg')
  if (!deleteInvalidMsgJob) {
    queue.add('deleteInvalidMsg', null, {
      removeOnComplete: true,
      attempts: 3,
      repeat: {
        tz: 'Europe/Rome',
        cron: '0 3 * * *'
      }
    })
  }

  /* Send Reminders */
  const sendRemindersJob = await queue.getJob('sendReminders')
  if (!sendRemindersJob) {
    queue.add('sendReminders', null, {
      removeOnComplete: true,
      attempts: 3,
      repeat: {
        tz: 'Europe/Rome',
        cron: '* * * * *'
      }
    })
  }

  /* Delete old discussion channels */
  const deleteOldDiscussionChannelsJob = await queue.getJob('deleteOldDiscussionChannels')
  if (!deleteOldDiscussionChannelsJob) {
    queue.add('deleteOldDiscussionChannels', null, {
      removeOnComplete: true,
      attempts: 3,
      repeat: {
        tz: 'Europe/Rome',
        cron: '0 * * * *'
      }
    })
  }

  /* Update the topic expiration of the discussion channels */
  const updateDiscussionChannelsTopicExpirationJob = await queue.getJob('updateDiscussionChannelsTopicExpiration')
  if (!updateDiscussionChannelsTopicExpirationJob) {
    queue.add('updateDiscussionChannelsTopicExpiration', null, {
      removeOnComplete: true,
      attempts: 3,
      repeat: {
        tz: 'Europe/Rome',
        cron: '*/10 * * * *'
      }
    })
  }

  logger.info('[SCHEDULER] Ready')
}
