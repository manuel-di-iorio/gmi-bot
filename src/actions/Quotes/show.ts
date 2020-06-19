import { Task } from '../../lib/Queue'
import { redis } from '../../lib/Redis'
import { DOUBLE_NEWLINE, NEWLINE } from '../../lib/utils/GetNewline'
import { MessageAttachment } from 'discord.js'
import { getUserDisplayName } from '../../lib/utils/GetUserDisplayName'
import logger from '../../lib/Logger'

const linkOnlyRegex = /(.*)(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})(.*)/

export default {
  resolver: (text: string) => text.startsWith(','),

  handler: async ({ text, reply, message }: Task) => {
    let input = text.replace(',', '').trim()
    if (!input) return

    let user = message.author.id

    // Check if there is a mention
    if (message.mentions.users.size) {
      const mentionedUser = message.mentions.users.first()
      user = mentionedUser.id
      input = input.replace(new RegExp(`(<@!${user}>)+`, 'g'), '').trim()
      const mentionedUserName = getUserDisplayName(message, user)

      // If the name is not provided, show all user quotes
      if (!input) {
        console.log('entra qui?')
        let resp = ''
        const quotes = await redis.hgetall(`quotes:${user}`)

        if (!quotes || !Object.keys(quotes).length) {
          return await reply(`non ci sono citazioni salvate da ${mentionedUserName}`)
        }

        Object.keys(quotes).forEach(quoteName => {
          resp += `\`${quoteName}\`  `
        })

        // if (message.guild) message.delete().catch((err: Error) => logger.error(err))

        return await message.channel.send(`**Citazioni di ${mentionedUserName + DOUBLE_NEWLINE + resp}**`)
      }
    }

    // Show the user quote
    const quote = await redis.hget(`quotes:${user}`, input)

    if (!quote) {
      const respMsg = message.author.id === user ? 'questa citazione' : `la citazione di <@!${user}> `
      return await reply(`non ho trovato ${respMsg} `)
    }

    let resp: string | MessageAttachment = quote

    const msgAuthor = `\`${getUserDisplayName(message)} ha scritto:\``

    if (message.guild) message.delete().catch((err: Error) => logger.error(err))

    // Check if the quote can be an attachment
    const regexResp = linkOnlyRegex.exec(quote)
    if (regexResp && !regexResp[1] && !regexResp[3]) {
      resp = new MessageAttachment(quote)
      await message.channel.send(msgAuthor, resp)
    } else {
      await message.channel.send(msgAuthor + NEWLINE + resp)
    }
  }
}
