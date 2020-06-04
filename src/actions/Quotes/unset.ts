import { Task } from '../../lib/Queue'
import { redis } from '../../lib/Redis'
import { getUserDisplayName } from '../../lib/utils/GetUserDisplayName'

export default {
  resolver: (text: string) => text.startsWith('unset'),

  handler: async ({ text, reply, message }: Task) => {
    const input = text.replace('unset', '').trim()
    if (!input) {
      return reply('manca il nome della citazione che vuoi cancellare')
    }

    const { id: authorId } = message.author

    if (!await (redis.hexists(`quotes:${authorId}`, input))) {
      return reply(`non ho trovato la citazione **${input}**
Puoi vedere le tue citazioni scrivendo \`,@${getUserDisplayName(message)}\``)
    }

    await redis.hdel(`quotes:${authorId}`, input)
    await reply(`ho cancellato la citazione **${input}**`)
  }
}
