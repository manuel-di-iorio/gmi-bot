import { promisify } from 'util'
import { google } from 'googleapis'
import { Task } from '../../lib/Queue'
import { GOOGLE_APIKEY, GOOGLE_SEARCH_CX } from '../../lib/Config'
import { NEWLINE } from '../../lib/utils/GetNewline'

const googleClient = google.customsearch('v1')
const googleSearchAsync = promisify(googleClient.cse.list.bind(googleClient.cse))

export default {
  cmd: 'google',

  handler: async ({ reply, text }: Task) => {
    const input = text.replace('google', '').trim()

    if (!input) return reply('specifica la query di ricerca. Esempio: `!google italia`')

    const { data: { items } } = await googleSearchAsync({ q: input, auth: GOOGLE_APIKEY, cx: GOOGLE_SEARCH_CX })
    if (!items || !items.length) return reply(`non ho trovato risultati per '${input}'`)
    const res = `il primo risultato da Google per '${input}' ${NEWLINE + items[0].link}`
    return reply(res)
  }
}
