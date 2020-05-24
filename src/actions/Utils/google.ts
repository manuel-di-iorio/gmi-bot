import { promisify } from 'util'
import { google } from 'googleapis'
import { Task } from '../../lib/Queue'
import { GOOGLE_APIKEY, GOOGLE_SEARCH_CX } from '../../lib/Config'
import logger from '../../lib/Logger'
import { NEWLINE } from '../../lib/utils/GetNewline'

const googleClient = google.customsearch('v1')
const googleSearchAsync = promisify(googleClient.cse.list.bind(googleClient.cse))

export default {
  resolver: (text: string) => text.startsWith('google'),

  handler: async ({ message, reply, text }: Task) => {
    const input = text.replace('google', '').trim()

    if (!input) {
      return reply('specifica la query di ricerca')
    }

    const { data: { items } } = await googleSearchAsync({ q: input, auth: GOOGLE_APIKEY, cx: GOOGLE_SEARCH_CX })
    if (!items || !items.length) return reply(`non ho trovato risultati per '${input}'`)

    let res = `i primi ${Math.min(3, items.length)} risultati da Google per '${input}' ${NEWLINE}`
    for (let i = 0, len = Math.min(3, items.length); i < len; i++) {
      const { link } = items[i]
      res += link + NEWLINE
    }

    const replyMsg = await reply(res)

    // Delete the messages after some time to avoid spam
    if (!message.guild) return

    setTimeout(async () => {
      try {
        await Promise.all([
          message.delete(),
          replyMsg.delete()
        ])
      } catch (err) {
        logger.error(err)
      }
    }, 1000 * 30)
  }
}
