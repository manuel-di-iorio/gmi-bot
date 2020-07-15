import { Task } from '../../lib/Queue'
import { redis } from '../../lib/Redis'
import { DOUBLE_NEWLINE } from '../../lib/utils/GetNewline'

export default {
  resolver: (text: string) => text.startsWith('quotes list'),

  handler: async ({ message, reply }: Task) => {
    let resp = ''
    const quotes = await redis.hgetall('quotes')

    if (!quotes || !Object.keys(quotes).length) {
      return await reply('non ci sono citazioni salvate')
    }

    Object.keys(quotes).forEach(quoteName => {
      resp += `\`${quoteName}\`  `
    })

    return await message.channel.send(`**Citazioni:** ${DOUBLE_NEWLINE + resp}`)
  }
}
