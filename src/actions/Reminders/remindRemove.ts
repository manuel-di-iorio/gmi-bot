import { Task } from '../../lib/Queue'
import { redis } from '../../lib/Redis'

export default {
  resolver: (text: string) => text.startsWith('remind remove'),

  handler: async ({ text, reply }: Task) => {
    const id = text.replace('remind remove', '').trim()
    if (!id) return reply("specifica l'ID del reminder da cancellare")
    const reminder = await redis.hget('reminders', id)
    if (!reminder) return reply('non ho trovato un reminder con questo id')
    await redis.hdel('reminders', id)
    reply('il reminder è stato cancellato con successo')
  }
}
