import { TextChannel, MessageAttachment } from 'discord.js'
import axios from 'axios'
import { TENOR_APIKEY, GMI_GUILD } from './Config'
import logger from './Logger'
import { bot } from './Discord'
import { NEWLINE } from './utils/GetNewline'

export const goodmorning = async () => {
  try {
    // Get the random gif
    const { data: { results } } = await axios(`https://api.tenor.com/v1/random?key=${TENOR_APIKEY}&locale=it_IT&q=buongiorno&limit=1`)
    if (!results) return

    // Send the message
    const mainChannel = bot.channels.cache.get(GMI_GUILD) as TextChannel
    const resp = new MessageAttachment(results[0].media[0].gif.url)
    mainChannel.send(`Buongiorno GMI <:sun_with_face:725777041663721542>${NEWLINE}`, resp)
  } catch (err) {
    logger.error(err)
  }
}
