import { Task } from '../../lib/Queue'
import { redis } from '../../lib/Redis'

export default {
  resolver: (text: string) => text.startsWith('unset'),

  handler: async ({ text, reply }: Task) => {
    const input = text.replace('unset', '').trim()
    if (!input) {
      return reply('manca il nome della citazione che vuoi cancellare')
    }

    if (!await (redis.hexists('quotes', input))) {
      return reply(`non ho trovato la citazione '**${input}**'`)
    }

    await redis.hdel('quotes', input)
    await reply(`ho cancellato la citazione **${input}**`)
  }
}
