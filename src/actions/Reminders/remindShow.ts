import moment from 'moment'
import { Task } from '../../lib/Queue'
import { redis } from '../../lib/Redis'
import { Reminder } from '../../lib/RemindersScheduler'
import { bot } from '../../lib/Discord'
import { getUserDisplayName } from '../../lib/utils/GetUserDisplayName'

const hasKey = Object.prototype.hasOwnProperty.call.bind(Object)

export default {
  resolver: (text: string) => text.startsWith('remind list'),

  handler: async ({ reply, message }: Task) => {
    const reminders = await redis.hgetall('reminders')
    if (!reminders || !Object.keys(reminders).length) return reply('non ci sono reminders salvati')

    let remindersText = ''
    for (const id in reminders) {
      if (!hasKey(reminders, id)) continue

      // Parse the reminder content
      const reminder: Reminder = JSON.parse(reminders[id])

      // Get the user
      const user = bot.users.cache.get(reminder.usr)
      const prettyDate = moment(new Date(reminder.exp)).format('DD/MM/YYYY [alle] HH:mm:ss')

      remindersText += `\`\`\`Creato da ${getUserDisplayName(message, user.id)} con scadenza ${prettyDate} (ID: ${id}) 
‟${reminder.msg}”
\`\`\`
`
    }

    await reply(`la lista dei reminders:
    
${remindersText}`)
  }
}
