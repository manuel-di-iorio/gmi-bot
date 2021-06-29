import axios from 'axios'
import cheerio from 'cheerio'
import { ApplicationCommandOptionType } from 'discord-api-types'
import { CommandInteraction } from 'discord.js'
import { NEWLINE } from '../../lib/utils/GetNewline'
import { InteractionConfig } from '../types'

const SKY_HOROSCOPE_ENDPOINT = 'https://oroscopo.sky.it/oroscopo/giorno/{SIGN}.html'
const HTML_SELECTOR = '.c-article-section.j-article-section.c-article-section--secondary.l-spacing-m p'

export const oroscopoInteraction: InteractionConfig = {
  interaction: {
    name: 'oroscopo',
    description: 'Mostra l\'oroscopo del giorno per il tuo segno',
    options: [{
      name: 'sign',
      type: ApplicationCommandOptionType.STRING,
      description: 'Segno zodiacale',
      required: true,
      choices: [
        { name: 'Ariete', value: 'ariete' },
        { name: 'Toro', value: 'toro' },
        { name: 'Gemelli', value: 'gemelli' },
        { name: 'Cancro', value: 'cancro' },
        { name: 'Leone', value: 'leone' },
        { name: 'Vergine', value: 'vergine' },
        { name: 'Bilancia', value: 'bilancia' },
        { name: 'Scorpione', value: 'scorpione' },
        { name: 'Sagittario', value: 'sagittario' },
        { name: 'Capricorno', value: 'capricorno' },
        { name: 'Acquario', value: 'acquario' },
        { name: 'Pesci', value: 'pesci' }
      ]
    }]
  },

  handler: async (message: CommandInteraction) => {
    const input = encodeURIComponent(message.options.first().value as string)
    await message.defer()

    // Get the horoscope HTML
    const { data: horoscopeHtml } = await axios(SKY_HOROSCOPE_ENDPOINT.replace('{SIGN}', input))

    // Extract the horoscope content from the HTML
    const $ = cheerio.load(horoscopeHtml)
    const text = $(HTML_SELECTOR).text()

    await message.editReply(`**OROSCOPO DEL GIORNO: ${input.toUpperCase()}**
\`\`\`
${text.replace(/\. /g, `.${NEWLINE}`)}
\`\`\``)
  }
}
