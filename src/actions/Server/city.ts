import { provinces, provincesToRegion } from '../../lib/utils/ProvincesList'
import { redis } from '../../lib/Redis'
import { Task } from '../../lib/Queue'
import { NEWLINE } from '../../lib/utils/GetNewline'
import { JaroWinklerDistance } from 'natural'

export default {
  cmd: 'city',

  handler: async ({ reply, message, text }: Task) => {
    // Get the input
    const input = text.replace('city', '').trim().toLowerCase()

    // Show your city if not input is specified
    const authorId = message.author.id
    if (!input) {
      const city = await redis.hget(`u:${authorId}:info`, 'city')

      if (!city) {
        return reply(`non hai ancora indicato la tua città. Usa \`!city <nome>\` per salvarla.${NEWLINE}Se invece vuoi vedere la città di un altro utente, usa \`!stats @user\``)
      } else {
        const region = provincesToRegion[city]
        return reply(`sei di ${city}${region ? `, ${region}` : ''}${NEWLINE}Se vuoi vedere la città di un altro utente, usa \`!stats @user\`${NEWLINE}Per rimuovere la città salvata, usa \`!city unset\``)
      }
    }

    // Remove the city if specified
    if (input === 'unset') {
      await redis.hdel(`u:${authorId}:info`, 'city')
      return reply('ho rimosso la città salvata')
    }

    // Find the province/region from the input
    const city = provinces.find(province => JaroWinklerDistance(input, province.toLowerCase()) > 0.9)
    if (!city) {
      return reply(`non ho trovato la città '${input}' tra le province italiane`)
    }
    await redis.hset(`u:${authorId}:info`, 'city', city)
    await reply('ho salvato la tua città. Puoi usare !stats per vederla')
  }
}
