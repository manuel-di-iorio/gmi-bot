import Canvas from 'canvas'
import { PNG } from 'pngjs'
import axios from 'axios'

const blockSize = 5 * 4

export const getAvgColorFromImg = async (image: string | Buffer) => {
  // When a URL is provided, load the buffer
  if (typeof image === 'string') {
    ({ data: image } = await axios.get(image, { responseType: 'arraybuffer' }))
  }

  // Get the image size
  const { width, height } = PNG.sync.read(image as Buffer)

  // Create the canvas context
  const canvas = Canvas.createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  // Draw the image onto the canvas
  const img = await Canvas.loadImage(image)
  ctx.drawImage(img, 0, 0)

  // Get the canvas pixel data
  const { data: pixelData } = ctx.getImageData(0, 0, width, height)

  // Calculate the average color
  let r = 0
  let g = 0
  let b = 0

  for (let i = 0, len = pixelData.length; i < len; i += blockSize) {
    r += pixelData[i]
    g += pixelData[i + 1]
    b += pixelData[i + 2]
  }

  const count = ~~(pixelData.length / blockSize)

  r = ~~(r / count)
  g = ~~(g / count)
  b = ~~(b / count)

  return '#' + (0x1000000 + (b | (g << 8) | (r << 16))).toString(16).slice(1)
}
