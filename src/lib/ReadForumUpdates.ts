import axios from 'axios'
import { TextChannel } from 'discord.js'
import Parser from 'rss-parser'
import moment from 'moment'
import he from 'he'
import logger from './Logger'
import { redis } from './Redis'
import { bot } from './Discord'
import { GMI_FORUM_CHANNEL, GMI_GUILD } from './Config'
import { isCpbotOnline } from './IsCpbotOnline'
import { NEWLINE } from './utils/GetNewline'

const GMI_FORUM_URL = 'https://gmitalia.altervista.org/forum'
const rssParser = new Parser()

export const start = () => {
  let forumChannel: TextChannel

  setInterval(async () => {
    // Check if the bot is ready
    forumChannel = bot.channels.cache.get(GMI_FORUM_CHANNEL) as TextChannel
    if (!forumChannel) return

    try {
      // Check if Cpbot is online
      if (await isCpbotOnline(bot.guilds.cache.get(GMI_GUILD))) return

      // Get the html/rss data
      const [{ data: homeHtml }, { data: rss }] = await Promise.all([
        axios(GMI_FORUM_URL) as Promise<{ data: string }>,
        axios('http://gmitalia.altervista.org/forum/app.php/feed') as Promise<{ data: string }>
      ])

      // New user check
      setImmediate(async () => {
        const newUser = homeHtml.match(/Ultimo iscritto <strong><a href="\.(.+)&amp;sid.+">(.+)<\/a>/)
        if (newUser) {
          const newUserLink = GMI_FORUM_URL + newUser[1].replace('amp;', '')
          const newUserName = newUser[2]

          // Compare the new user and send the notification
          const cachedNewUser = await redis.get('forum:newUser')
          await redis.set('forum:newUser', newUserName)
          if (!cachedNewUser || cachedNewUser === newUserName) return

          try {
            await forumChannel.send(`:new: Nuovo utente iscritto al forum: **${newUserName}**
${newUserLink}`)
          } catch (err) {
            logger.error(err)
          }
        }
      })

      // RSS new topics check
      setImmediate(async () => {
        try {
          // Parse the RSS
          const feed = await rssParser.parseString(rss)
          const { items } = feed
          const lastUpdate = feed.lastBuildDate

          // Check the last update in cache
          const cachedLastUpdate = await redis.get('forum:lastUpdate')
          await redis.set('forum:lastUpdate', lastUpdate)
          if (!cachedLastUpdate || cachedLastUpdate === lastUpdate) return
          const cachedLastUpdateDate = new Date(cachedLastUpdate)

          // Parse the items
          for (let i = items.length - 1; i >= 0; i--) {
            const item = items[i]
            if (new Date(item.pubDate) < cachedLastUpdateDate) continue

            let content = item.content
              .replace('\n', '')
              .replace(/<br>/g, NEWLINE)
              .replace(/(<a.+href="(.+?)".+)<\/a>/g, '$2')
              .replace(/<.+?>/g, '')
            content = he.decode(content)
              .substr(0, 1600)

            const isAuthorOrReply = item.title.includes('Re: ') ? 'Risposta da' : 'Autore'

            await forumChannel.send(`:arrow_right: **${item.title}**
Link: ${item.link}
${isAuthorOrReply}: ${item.author}
Data: ${moment(item.pubDate).format('DD/MM/YYYY HH:mm:ss')}

\`\`\`${content}\`\`\`
<:devati:628999347283034142>`)
          }
        } catch (err) {
          logger.error(err)
        }
      })
    } catch (err) {
      logger.error(err)
    }
  }, 30000)

  logger.info('[FORUM] Ready')
}
