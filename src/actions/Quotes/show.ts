import { Task } from '../../lib/Queue'
import { redis } from '../../lib/Redis'
import { NEWLINE } from '../../lib/utils/GetNewline'
import { MessageAttachment } from 'discord.js'
import { getUserDisplayName } from '../../lib/utils/GetUserDisplayName'
import logger from '../../lib/Logger'

const linkOnlyRegex = /(.*)(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})(.*)/

export default {
  cmd: ',',

  handler: async ({ text, reply, message }: Task) => {
    const input = text.replace(',', '').trim()
    if (!input) return

    const quote = await redis.hget('quotes', input)

    if (!quote) {
      return await reply(`non ho trovato la citazione '${input}'`)
    }

    let resp: string | MessageAttachment = quote

    const msgAuthor = `\`${getUserDisplayName(message)} ha scritto:\``

    if (message.guild) message.delete().catch((err: Error) => logger.error(err))

    // Check if the quote can be an attachment
    const regexResp = linkOnlyRegex.exec(quote)
    if (regexResp && !regexResp[1] && !regexResp[3]) {
      resp = new MessageAttachment(quote)
      await message.channel.send({ content: msgAuthor, files: [resp] })
    } else {
      await message.channel.send(msgAuthor + NEWLINE + resp)
    }
  }
}
