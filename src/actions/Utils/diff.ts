import { PNG } from 'pngjs'
import axios from 'axios'
import Canvas from 'canvas'
import { MessageAttachment } from 'discord.js'
import { Task } from '../../lib/Queue'
import { getUserDisplayName } from '../../lib/utils/GetUserDisplayName'
import { findMentionedUsersFromPlainText } from '../../lib/utils/FindMentionedUserFromText'

const DIFF_TOLLERANCE = 15

export default {
  cmd: 'diff',

  handler: async ({ reply, message, text }: Task) => {
    let mentions = message.mentions.users.array()

    if (message.guild && mentions.length !== 2) {
      mentions = mentions.concat(findMentionedUsersFromPlainText(text.replace('diff', ''), message.guild.members.cache))
    }
    if (mentions.length !== 2) {
      return reply('usa `!diff @user1 @user2` per comparare due avatar')
    }

    // Load the images
    const imagesFn = mentions.map(mention => async () => (
      (await axios.get(mention.displayAvatarURL({ format: 'png', size: 256 }), { responseType: 'arraybuffer' })).data
    ))
    const images: Buffer[] = await Promise.all(imagesFn.map(fn => fn()))

    // Get the size of the smaller image
    const imagesPng = images.map(image => PNG.sync.read(image))

    let size: number
    imagesPng.forEach(imgPng => {
      if (!size || imgPng.width < size) size = imgPng.width
    })

    // Resize the images and apply the grayscale effect
    const resizeFn = []
    const resizedImages: { buffer: Buffer; ctx: CanvasRenderingContext2D }[] = []
    images.forEach((imgPng, idx) => {
      resizeFn.push(async () => {
        const canvasImg = await Canvas.loadImage(imgPng)
        const canvas = Canvas.createCanvas(size, size)
        const ctx = canvas.getContext('2d')

        ctx.fillStyle = '#FFF'
        ctx.fillRect(0, 0, size, size)
        ctx.globalCompositeOperation = 'luminosity'
        ctx.drawImage(canvasImg, 0, 0, size, size)

        resizedImages[idx] = { buffer: canvas.toBuffer(), ctx }
      })
    })
    await Promise.all(resizeFn.map(fn => fn()))

    // Create the diff image
    const diffCanvas = Canvas.createCanvas(size, size)
    const diffCtx = diffCanvas.getContext('2d')
    diffCtx.clearRect(0, 0, size, size)

    // Compare the images
    const imgCtxData1 = resizedImages[0].ctx.getImageData(0, 0, size, size).data
    const imgCtxData2 = resizedImages[1].ctx.getImageData(0, 0, size, size).data
    let differentPixels = 0

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const pos = 4 * (x + y * size)

        // Get the pixels
        const pixelRed1 = imgCtxData1[pos]
        const pixelRed2 = imgCtxData2[pos]
        const pixelGreen1 = imgCtxData1[pos + 1]
        const pixelGreen2 = imgCtxData2[pos + 1]
        const pixelBlue1 = imgCtxData1[pos + 2]
        const pixelBlue2 = imgCtxData2[pos + 2]

        // Diff check
        if (
          Math.abs(pixelRed1 - pixelRed2) > DIFF_TOLLERANCE ||
          Math.abs(pixelGreen1 - pixelGreen2) > DIFF_TOLLERANCE ||
          Math.abs(pixelBlue1 - pixelBlue2) > DIFF_TOLLERANCE
        ) {
          differentPixels += 1
        }
      }
    }

    const canvasImg = await Canvas.loadImage(resizedImages[0].buffer)
    const canvasImg2 = await Canvas.loadImage(resizedImages[1].buffer)
    diffCtx.globalCompositeOperation = 'soft-light'
    diffCtx.drawImage(canvasImg, 0, 0)
    diffCtx.drawImage(canvasImg2, 0, 0)
    diffCtx.globalCompositeOperation = 'exclusion'
    diffCtx.drawImage(canvasImg2, 0, 0)

    const totalPixels = size * size
    const diffPercentage = (100 / totalPixels * (totalPixels - differentPixels)).toFixed(5) + '%'

    // Send the result
    const attachment = new MessageAttachment(diffCanvas.toBuffer(), 'diff.png')
    message.channel.send(`\`\`\`Differenza di avatar tra ${getUserDisplayName(message, mentions[0].id)} e ${getUserDisplayName(message, mentions[1].id)} (simili al ${diffPercentage})\`\`\``, attachment)
  }
}
