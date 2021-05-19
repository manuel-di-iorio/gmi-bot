import { ApplicationCommandOptionType } from 'discord-api-types'
import { CommandInteraction } from 'discord.js'
import { JaroWinklerDistance } from 'natural'
import { redis } from '../../lib/Redis'
import { NEWLINE } from '../../lib/utils/GetNewline'
import { provinces, provincesToRegion } from '../../lib/utils/ProvincesList'

export const cityInteraction = {
  version: 0,
  oldVersion: 0,

  interaction: {
    name: 'city',
    description: 'Salva la tua città sul tuo profilo',
    options: [
      {
        name: 'save',
        type: ApplicationCommandOptionType.SUB_COMMAND,
        description: 'Salva la tua città',
        options: [
          {
            name: 'name',
            type: ApplicationCommandOptionType.STRING,
            description: 'Nome della città',
            required: true
          }
        ]
      },
      {
        name: 'remove',
        type: ApplicationCommandOptionType.SUB_COMMAND,
        description: 'Rimuove la tua città'
      },
      {
        name: 'show',
        type: ApplicationCommandOptionType.SUB_COMMAND,
        description: 'Mostra la tua città'
      }
    ]
  },

  handler: async (message: CommandInteraction) => {
    const authorId = message.user.id
    const currentCity = await redis.hget(`u:${authorId}:info`, 'city')

    // Get the specified sub command
    const { name, options } = message.options.first()

    let input: string
    let city: string
    switch (name) {
      case 'save':
        input = options.first().value as string

        // Find the province/region from the input
        city = provinces.find(province => JaroWinklerDistance(input as string, province.toLowerCase()) > 0.9)
        if (!city) {
          return message.reply(`Non ho trovato la città '${input}' tra le province italiane`)
        }
        await redis.hset(`u:${authorId}:info`, 'city', city)
        await message.reply('Ho salvato la tua città. Puoi usare /stats per vedere il tuo profilo')
        break

      case 'remove':
        // Remove the city if specified
        if (!currentCity) {
          return await message.reply('Non hai ancora indicato la tua città. Scrivi /city save <name> per salvarla')
        }

        await redis.hdel(`u:${authorId}:info`, 'city')
        await message.reply('Ho rimosso la tua città salvata')
        break

      case 'show':
        // Show your city if not input is specified
        if (!currentCity) {
          await message.reply('Non hai ancora indicato la tua città. Scrivi /city save <name> per salvarla')
        } else {
          const region = provincesToRegion[currentCity]
          await message.reply(`Sei di ${currentCity}${region ? `, ${region}` : ''}${NEWLINE}Se vuoi vedere la città di un altro utente, usa \`/stats @user\`${NEWLINE}Per rimuovere la città salvata, usa \`/city remove\``)
        }
        break
    }
  }
}
