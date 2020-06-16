import { Task } from '../../lib/Queue'
import { redis } from '../../lib/Redis'
import { NEWLINE } from '../../lib/utils/GetNewline'

export default {
  resolver: (text: string) => text.startsWith('emotes'),

  handler: async ({ message, reply, text }: Task) => {
    const guild = message.guild
    if (!guild) return reply(`Scusa ${message.author.username} ma questo comando non è disponibile qui.`)

    // Get the input
    const input = text.replace('emotes', '').trim()
    const limit = 19
    const page = input && !isNaN(parseInt(input)) ? parseInt(input) - 1 : 0
    let pageOffset = page * limit
    if (page > 0) pageOffset += 1

    const emotes = (await redis.zrevrange('emotes', pageOffset, pageOffset + limit, 'WITHSCORES'))
    if (!emotes.length) {
      return reply('nessuna emote trovata per questa pagina')
    }

    let response = `ecco la classifica delle emotes di questo server

`
    for (let i = 0, l = emotes.length; i < l; i += 2) {
      const emote = emotes[i]

      // Filter deleted emotes
      let emoteId = emote.split(':')[2]
      emoteId = emoteId.substr(0, emoteId.length - 1)
      if (!guild.emojis.cache.has(emoteId)) continue

      // Log the emote score
      response += `${emote}  **${emotes[i + 1]}**`
      response += NEWLINE
    }

    response += `${NEWLINE}\`Pagina ${page + 1}. Scrivi !emotes ${page + 2} per vedere la pagina successiva\``

    await reply(response)
  }
}
