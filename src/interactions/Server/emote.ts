import Canvas from 'canvas'
import { CommandInteraction, MessageAttachment, MessageEmbed, TextChannel } from 'discord.js'
import { BOT_COLOR, GMI_GUILD } from '../../lib/Config'
import { bot } from '../../lib/Discord'
import logger from '../../lib/Logger'
import { redis } from '../../lib/Redis'

const CANVAS_SIZE = 768
const EMOTE_START_XOFFSET = 5
const EMOTE_START_YOFFSET = 15
const EMOTE_MAX_HEIGHT = 60
const EMOTE_MAX_WIDTH = EMOTE_MAX_HEIGHT + ~~EMOTE_MAX_HEIGHT / 2
const EMOTE_FULL_WIDTH = 255
const EMOTE_YMARGIN = 7
const EMOTE_MAX_PER_COLUMN = 11
const EMOTE_SCORE_MARGIN = 6

const imagesCache = {}
const canvasList = []

// Render the emote stats
const renderStats = async (page = 0) => {
  const canvas = Canvas.createCanvas(CANVAS_SIZE, CANVAS_SIZE)
  const ctx = canvas.getContext('2d')
  const guild = bot.guilds.cache.get(GMI_GUILD)

  let pageOffset = page * 33
  if (page > 0) pageOffset += 1

  let emotes: string[]
  try {
    emotes = await redis.zrevrange('emotes', pageOffset, pageOffset + 33, 'WITHSCORES')
  } catch (e) {
    return logger.error(e)
  }

  // Filter deleted emotes
  const guildEmotes = []
  for (let i = 0, l = emotes.length; i < l; i += 2) {
    const emote = emotes[i]

    const emoteSplit = emote.split(':')
    let emoteId = emoteSplit[2]
    if (!emoteId) continue
    emoteId = emoteId.substr(0, emoteId.length - 1)
    if (!guild.emojis.cache.has(emoteId)) continue

    guildEmotes.push({
      emote,
      name: emoteSplit[1].slice(0, 13),
      url: guild.emojis.cache.get(emoteId).url,
      score: emotes[i + 1]
    })
  }

  if (!guildEmotes.length) return

  ctx.fillStyle = 'white'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.strokeStyle = '#222'
  ctx.strokeRect(0, 0, canvas.width, canvas.height)

  ctx.textBaseline = 'middle'

  // Load the images
  const imageTasks = []
  for (const { url } of guildEmotes) {
    const cachedImg = imagesCache[url]
    if (!cachedImg) {
      imageTasks.push(() => Canvas.loadImage(url))
    } else {
      imageTasks.push(() => cachedImg)
    }
  }
  let images: Canvas.Image[]
  try {
    images = await Promise.all(imageTasks.map(task => task()))
  } catch (e) {
    return logger.error(e)
  }

  // Draw the emote images and their score
  for (let i = 0, l = guildEmotes.length; i < l; i++) {
    const emote = guildEmotes[i]
    const image = images[i]
    const ratio = image.width / image.height
    const column = Math.floor(i / EMOTE_MAX_PER_COLUMN)
    const h = EMOTE_MAX_HEIGHT
    const w = Math.min(h * ratio, EMOTE_MAX_WIDTH)
    const x = EMOTE_START_XOFFSET + EMOTE_MAX_WIDTH / 2 - w / 2 + EMOTE_FULL_WIDTH * column
    const y = EMOTE_START_YOFFSET + (i % EMOTE_MAX_PER_COLUMN) * (EMOTE_MAX_HEIGHT + EMOTE_YMARGIN)

    // Draw the emote
    ctx.drawImage(image, x, y, w, h)

    // Draw the name
    ctx.fillStyle = '#333'
    ctx.font = 'bold 19px Arial'
    ctx.globalAlpha = 0.2
    ctx.fillText(emote.name, x + w / 2 + EMOTE_MAX_WIDTH / 2 + EMOTE_SCORE_MARGIN + 2, y + h / 2 - h / 4 + 2)
    ctx.fillStyle = '#06c'
    ctx.globalAlpha = 1
    ctx.fillText(emote.name, x + w / 2 + EMOTE_MAX_WIDTH / 2 + EMOTE_SCORE_MARGIN, y + h / 2 - h / 4)

    // Draw the score
    ctx.fillStyle = '#444'
    ctx.font = 'bold 28px Arial'
    ctx.fillText(emote.score, x + w / 2 + EMOTE_MAX_WIDTH / 2 + EMOTE_SCORE_MARGIN, y + h / 2 + h / 4)
  }

  canvasList[page] = canvas
  renderStats(page + 1)
}

export const startEmoteStatsRendering = () => {
  renderStats()
  setInterval(() => {
    canvasList.length = 0
    renderStats()
  }, 60000 * 3)
  logger.info('[EMOTE STATS SCHEDULER] Ready')
}

export const emoteInteraction = {
  version: 0,
  oldVersion: 0,

  interaction: {
    name: 'emote',
    description: 'Mostra la classifica delle emote del server'
  },

  handler: async (message: CommandInteraction) => {
    const channel = bot.channels.cache.get(message.channelID) as TextChannel
    await message.defer()

    // Send the message
    for (let i = 0, l = canvasList.length; i < l; i++) {
      const canvas = canvasList[i]
      const attachment = new MessageAttachment(canvas.toBuffer(), 'emotes.png')
      const embed = new MessageEmbed()
        .setColor(BOT_COLOR)
        .setAuthor('Classifica emotes | GameMaker Italia', message.guild.iconURL())
        .setImage('attachment://emotes.png')

      if (l > 1) {
        embed.setFooter(`Pagina ${i + 1} di ${l}`)
      }

      const text = `**Classifica emotes | Pagina ${i + 1} di ${l}**`

      await (!i
        // @ts-expect-error
        ? message.editReply(text, attachment)
        : channel.send(text, attachment)
      )
    }

    if (!canvasList.length) {
      await message.editReply('Non sono ancora state inviate emote')
    }
  }
}
