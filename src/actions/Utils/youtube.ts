import { promisify } from 'util'
import yts from 'yt-search'
import { Task } from '../../lib/Queue'
import logger from '../../lib/Logger'
import { NEWLINE } from '../../lib/utils/GetNewline'

const ytsAsync = promisify(yts)

export default {
  resolver: (text: string) => text.startsWith('yt'),

  handler: async ({ message, reply, text }: Task) => {
    const input = text.replace('yt', '').trim()

    if (!input) {
      return reply('specifica la query di ricerca')
    }

    const { videos } = await ytsAsync(input)
    if (!videos || !videos.length) return reply(`non ho trovato risultati per '${input}'`)

    let res = `i primi ${Math.min(2, videos.length)} risultati da YouTube per '${input}' ${NEWLINE}`

    for (let i = 0, len = Math.min(2, videos.length); i < len; i++) {
      const { url } = videos[i]
      res += `${url}  `
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
