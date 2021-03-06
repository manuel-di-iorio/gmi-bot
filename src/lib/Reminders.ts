import logger from './Logger'
import { bot } from './Discord'
import { redis } from './Redis'
import { Snowflake, TextChannel } from 'discord.js'
import { NEWLINE } from './utils/GetNewline'

export interface Reminder {
  msg: string;
  exp: string;
  usr: string;
  chn: string;
}

const hasKey = Object.prototype.hasOwnProperty.call.bind(Object)

export const sendReminders = async () => {
  // Get all the active reminders
  let reminders: Record<string, string>
  try {
    reminders = await redis.hgetall('reminders')
  } catch (err) {
    logger.error(err)
  }
  if (!reminders || !Object.keys(reminders).length) return

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
        bot.users.fetch(reminder.usr as Snowflake),
        bot.channels.fetch(reminder.chn as Snowflake) as unknown as TextChannel
      ])

      // Ensure to delete the reminder before sending it to the user (to avoid duplicates)
      await redis.hdel('reminders', id)

      // Send the reminder message to the user
      if (!channel) {
        logger.debug(`[Scheduler] Channel ${channel} not found for the reminder #${id}`)
        continue
      }

      await channel.send(`⚠️ **REMINDER DI ${user}** ⚠️${NEWLINE + reminder.msg}`)
    } catch (err) {
      if (err.code === 50001) { // DiscordMissingAccessError
        redis.hdel('reminders', id).catch((err: Error) => logger.error(err))
      } else {
        logger.error('[REMINDERS SCHEDULER] Error:')
        logger.error(err)
      }
    }
  }
}
