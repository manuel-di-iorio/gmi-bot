import { Message, MessageEmbed, Snowflake, TextChannel } from 'discord.js'
import moment from 'moment'
import { bot } from './Discord'
import logger from './Logger'
import { redis } from './Redis'
import { BOT_COLOR, EVENT_COUNTDOWN_ONEBIT_CHANNEL } from './Config'

const endTime = new Date(2021, 6, 10, 9, 59, 59, 999)
const EVENT_COUNTDOWN_ONEBIT_END_TIME = +endTime

let message: Message

const pad = (n: number) => n < 10 ? '0' + n : n

const updateMessage = async () => {
  try {
    const diff = (EVENT_COUNTDOWN_ONEBIT_END_TIME - +new Date()) / 1000

    const days = Math.floor(diff / 24 / 60 / 60)
    const hoursLeft = Math.floor((diff) - (days * 86400))
    const hours = Math.floor(hoursLeft / 3600)
    const minutesLeft = Math.floor((hoursLeft) - (hours * 3600))
    const minutes = Math.floor(minutesLeft / 60)
    const seconds = Math.floor(diff % 60)

    if (diff <= 0) {
      const embed = new MessageEmbed()
      embed.setColor(BOT_COLOR)
      embed.setTitle('1Bit Jam Countdown')
      embed.setDescription('Il conto alla rovescia è terminato. Buona fortuna jammers!')
      embed.setThumbnail('https://cdn.discordapp.com/attachments/857474289970970634/863120314249379890/unknown.png')
      return await message.edit({ embeds: [embed] })
    }

    const padDays = days.toString()
    const padHours = pad(hours)
    const padMinutes = pad(minutes)
    const padSeconds = pad(seconds)

    // Render the image
    const prettyDate = moment(endTime).format('DD MMMM YYYY [alle] HH:mm:ss')
    const embed = new MessageEmbed()
    embed.setColor(BOT_COLOR)
    embed.setTitle('1Bit Jam Countdown')
    embed.setDescription(`**${padDays}** giorni, **${padHours}** ore, **${padMinutes}** minuti, **${padSeconds}** secondi`)
    embed.setThumbnail('https://cdn.discordapp.com/attachments/857474289970970634/863120314249379890/unknown.png')
    embed.setFooter('Finisce il ' + prettyDate)
    await message.edit({ embeds: [embed] })
  } catch (err) {
    logger.error(err)
  }

  setTimeout(updateMessage, 1000)
}

export const start = async () => {
  if (EVENT_COUNTDOWN_ONEBIT_END_TIME < +new Date()) return

  // Get the Discord message
  const channel = bot.channels.cache.get(EVENT_COUNTDOWN_ONEBIT_CHANNEL as Snowflake) as TextChannel

  const cacheMessageId = await redis.get('countdowns:1bit:msg') as Snowflake

  if (!cacheMessageId) {
    const embed = new MessageEmbed()
    embed.setColor(BOT_COLOR)
    embed.setTitle('1Bit Jam Countdown')
    embed.setThumbnail('https://cdn.discordapp.com/attachments/857474289970970634/863120314249379890/unknown.png')
    message = await channel.send({ embeds: [embed] })
    await redis.set('countdowns:1bit:msg', message.id)
  } else {
    message = await channel.messages.fetch(cacheMessageId)
  }

  if (!message) return logger.debug('[EventCountdown] Message not found')

  updateMessage()
}
