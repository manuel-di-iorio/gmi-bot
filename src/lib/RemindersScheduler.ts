import logger from './Logger'
import { bot } from './Discord'
import { redis } from './Redis'
import { TextChannel } from 'discord.js'

export interface Reminder {
  msg: string;
  exp: string;
  usr: string;
  chn: string;
}

const hasKey = Object.prototype.hasOwnProperty.call.bind(Object)
const timeout = 3000

export const start = () => {
  const sendReminders = async () => {
    // Get all the active reminders
    let reminders: Record<string, string>
    try {
      reminders = await redis.hgetall('reminders')
    } catch (err) {
      logger.error(err)
    }
    if (!reminders || !Object.keys(reminders).length) return setTimeout(sendReminders, timeout)

    const now = Date.now()
    for (const id in reminders) {
      if (!hasKey(reminders, id)) continue

      // Parse the reminder content
      const reminder: Reminder = JSON.parse(reminders[id])

      // Expiration check
      if (now < new Date(reminder.exp).getTime()) continue

      try {
        // Get the updated user and channel
        const [user, channel] = await Promise.all([
          bot.users.fetch(reminder.usr),
          bot.channels.fetch(reminder.chn) as unknown as TextChannel
        ])

        // Ensure to delete the reminder before sending it to the user (to avoid duplicates)
        await redis.hdel('reminders', id)

        // Send the reminder message to the user
        if (!channel) {
          logger.debug(`[Scheduler] Channel ${channel} not found for the reminder #${id}`)
          continue
        }

        await channel.send(`⚠️ **REMINDER** ⚠️ ${user}, ti ricordo che:
${reminder.msg}`)
      } catch (err) {
        logger.error('[SCHEDULER] Error:')
        logger.error(err)
      }
    }

    setTimeout(sendReminders, timeout)
  }

  setTimeout(sendReminders, timeout)
  logger.info('[REMINDERS SCHEDULER] Ready')
}
