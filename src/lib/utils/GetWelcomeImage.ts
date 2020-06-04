import { join } from 'path'
import { MessageAttachment, GuildMember, PartialGuildMember } from 'discord.js'
import Canvas from 'canvas'
import logger from '../Logger'

// Load the background
let backgroundPromise: Canvas.Image;
(async (): Promise<void> => {
  try {
    backgroundPromise = await Canvas.loadImage(join(__dirname, '..', '..', '..', 'assets', 'welcome-background.png'))
  } catch (err) {
    logger.error(err)
  }
})()

// Create the canvas
const canvas = Canvas.createCanvas(700, 250)
const ctx = canvas.getContext('2d')

const getFontByText = (text: string): string => {
  // Declare a base size of the font
  let fontSize = 70

  do {
    // Assign the font to the context and decrement it so it can be measured again
    ctx.font = `${fontSize -= 10}px sans-serif`
    // Compare pixel width of the text to the canvas minus the approximate avatar size
  } while (ctx.measureText(text).width > canvas.width - 300)

  // Return the result to use in the actual canvas
  return ctx.font
}

/** Get a customized welcome image to say hi to the new user */
export const getWelcomeImage = async (guildMember: GuildMember | PartialGuildMember): Promise<MessageAttachment> => {
  // Load the images
  const [background, avatar] = await Promise.all([
    backgroundPromise,
    Canvas.loadImage(guildMember.user.displayAvatarURL({ format: 'png' }))
  ])

  // Draw the background
  ctx.drawImage(background, 0, 0, canvas.width, canvas.height)

  // Draw the smaller welcome text
  ctx.font = '32px sans-serif'
  ctx.fillStyle = '#ffffff'
  ctx.fillText('Benvenuto/a su GMI,', canvas.width / 2.6, canvas.height / 2.8)

  // Draw the text
  const displayName = guildMember.displayName
  ctx.font = getFontByText(displayName)
  ctx.fillStyle = '#ffffff'
  ctx.fillText(`${displayName}!`, canvas.width / 2.6, canvas.height / 1.6)

  // Draw the user avatar
  ctx.beginPath()
  ctx.arc(125, 125, 100, 0, Math.PI * 2, true)
  ctx.closePath()
  ctx.clip()
  ctx.drawImage(avatar, 25, 25, 200, 200)

  return new MessageAttachment(canvas.toBuffer(), `welcome-${displayName}.png`)
}
