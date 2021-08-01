import { promisify } from 'util'
import { CommandInteraction } from 'discord.js'
import { google } from 'googleapis'
import { GOOGLE_APIKEY } from '../../lib/Config'
import { NEWLINE } from '../../lib/utils/GetNewline'

const ytClient = google.youtube('v3')
const ytSearchAsync = promisify(ytClient.search.list.bind(ytClient.search))

export const ytInteraction = {
  interaction: {
    name: 'yt',
    description: 'Cerca un video su YouTube',
    options: [{
      name: 'query',
      type: 'STRING',
      description: 'Query di ricerca',
      required: true
    }]
  },

  handler: async (message: CommandInteraction) => {
    const input = message.options.data[0].value

    // Execute the YouTube search
    const { data: { items } } = await ytSearchAsync({
      q: input,
      part: 'snippet',
      auth: GOOGLE_APIKEY,
      maxResults: 1,
      type: 'video'
    })
    if (!items || !items.length) return message.reply(`Non ho trovato risultati per '${input}'`)

    // Show the first result from the search
    const res = `Il primo risultato da YouTube per '${input}' ${NEWLINE}https://www.youtube.com/watch?v=${items[0].id.videoId}`
    await message.reply(res)
  }
}
