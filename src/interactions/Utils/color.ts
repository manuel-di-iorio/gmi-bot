import Canvas from 'canvas'
import { CommandInteraction, MessageAttachment } from 'discord.js'

export const colorInteraction = {
  interaction: {
    name: 'color',
    description: 'Mostra un colore',
    options: [{
      name: 'color',
      type: 'STRING',
      description: 'Colore da mostrare',
      required: true
    }]
  },

  handler: async (message: CommandInteraction) => {
    let input = message.options.data[0].value as string

    if (input[0] !== '#') input = '#' + input

    if (!/^#[0-9A-F]{6}$/i.test(input)) {
      return message.reply('Non hai indicato un colore corretto. Scrivi /color #rrggbb per mostrare un colore')
    }

    // Create the colored image
    const canvas = Canvas.createCanvas(64, 50)
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = input
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const attachment = new MessageAttachment(canvas.toBuffer(), 'color.png')
    await message.deferReply()
    await message.editReply({ files: [attachment] })
  }
}
