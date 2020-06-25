import { promisify } from 'util'
import { google } from 'googleapis'
import { Task } from '../../lib/Queue'
import { GOOGLE_APIKEY } from '../../lib/Config'
import { NEWLINE } from '../../lib/utils/GetNewline'

const ytClient = google.youtube('v3')
const ytSearchAsync = promisify(ytClient.search.list.bind(ytClient.search))

export default {
  resolver: (text: string) => text.startsWith('yt'),

  handler: async ({ reply, text }: Task) => {
    const input = text.replace('yt', '').trim()

    if (!input) {
      return reply('specifica la query di ricerca')
    }

    const { data: { items } } = await ytSearchAsync({ q: input, part: 'snippet', auth: GOOGLE_APIKEY, maxResults: 1, type: 'video' })
    if (!items || !items.length) return reply(`non ho trovato risultati per '${input}'`)
    const res = `il primo risultato da YouTube per '${input}' ${NEWLINE}https://www.youtube.com/watch?v=${items[0].id.videoId}`

    return reply(res)
  }
}
