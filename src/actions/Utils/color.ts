import Canvas from 'canvas'
import { MessageAttachment } from 'discord.js'
import { Task } from '../../lib/Queue'

export default {
  cmd: 'color',

  handler: async ({ reply, message, text }: Task) => {
    // Get the input
    let input = text.replace('color', '').trim().toLowerCase()

    if (!input) {
      return reply(`non hai indicato il colore da mostrare. Scrivi !color #rrggbb per mostrarlo`)
    }

    if (input[0] !== "#") input = "#" + input;

    if (!/^#[0-9A-F]{6}$/i.test(input)) {
      return reply("non hai indicato un colore corretto. Scrivi !color #rrggbb per mostrarlo")
    }

    // Create the colored image
    const canvas = Canvas.createCanvas(64, 64)
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = input
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    const attachment = new MessageAttachment(canvas.toBuffer(), 'color.png')
    await message.channel.send(attachment)
  }
}
