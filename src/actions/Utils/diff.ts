import { PNG } from 'pngjs'
import pixelmatch from 'pixelmatch'
import axios from 'axios'
import Canvas from 'canvas'
import { Task } from '../../lib/Queue'
import { getUserDisplayName } from '../../lib/utils/GetUserDisplayName'
import { MessageAttachment } from 'discord.js'

export default {
  resolver: (text: string) => text.startsWith('diff'),

  handler: async ({ reply, message }: Task) => {
    const mentions = message.mentions.users

    if (mentions.size !== 2) {
      return reply('Usa`!diff @user1 @user2` per comparare due avatar')
    }

    // Load the images
    const imagesFn = mentions.map(mention => async () => (
      (await axios.get(mention.displayAvatarURL({ format: 'png', size: 256 }), { responseType: 'arraybuffer' })).data
    ))
    const images = await Promise.all(imagesFn.map(fn => fn()))
    const imagesPng = images.map(image => PNG.sync.read(image))

    // Get the size of the lowest image
    let size: number
    imagesPng.forEach(imgPng => {
      if (!size || imgPng.width < size) size = imgPng.width
    })

    // Resize the images and apply the grayscale effect
    const resizeFn = []
    imagesPng.forEach((imgPng, idx) => {
      resizeFn.push(async () => {
        const canvasImg = await Canvas.loadImage(PNG.sync.write(imgPng))
        const canvas = Canvas.createCanvas(size, size)
        const ctx = canvas.getContext('2d')

        ctx.fillStyle = '#FFF'
        ctx.fillRect(0, 0, size, size)
        ctx.globalCompositeOperation = 'luminosity'
        ctx.drawImage(canvasImg, 0, 0, size, size)

        imagesPng[idx] = PNG.sync.read(canvas.toBuffer())
      })
    })
    await Promise.all(resizeFn.map(fn => fn()))

    require('fs').writeFileSync('test.png', PNG.sync.write(imagesPng[0]))

    // Compare the images
    const diffImg = new PNG({ width: size, height: size })
    const diffPixels = pixelmatch(imagesPng[0].data, imagesPng[1].data, diffImg.data, size, size, {
      threshold: 0.3,
      diffColor: [30, 30, 30],
      aaColor: [0, 255, 0],
      alpha: 0.4
    })
    const diffPercentage = (100 - 100 / (size * size) * diffPixels).toFixed(4) + '%'

    // Send the result
    const attachment = new MessageAttachment(PNG.sync.write(diffImg), 'diff.png')
    message.channel.send(`\`\`\`Differenza di avatar tra ${getUserDisplayName(message, mentions.first().id)} e ${getUserDisplayName(message, mentions.last().id)} (simili al ${diffPercentage})\`\`\``, attachment)
  }
}
