import { User, PartialUser } from 'discord.js'
import ColorThief from 'colorthief'
import * as UserModel from '../../models/User'
import logger from '../Logger'

export const getAvatarTopColor = async (user: User | PartialUser) => {
  try {
    // Get the color from the cache if available. Also check if the avatar URL is different
    const avatarId = user.avatar
    const colorCache = await UserModel.getColor(user.id)
    if (colorCache) {
      const colorCacheSplit = colorCache.split('|')
      if (colorCacheSplit[0] === avatarId) return colorCacheSplit[1]
    }

    // Otherwise calculate and store the new color
    const userAvatarUrl = user.displayAvatarURL({ format: 'png', size: 64 })
    const color = await ColorThief.getColor(userAvatarUrl)
    const hexColor = '#' + (0x1000000 + (color[2] | (color[1] << 8) | (color[0] << 16))).toString(16).slice(1)

    UserModel.setColor(user.id, `${avatarId}|${hexColor}`).catch((e: Error) => logger.error(e))

    return hexColor
  } catch (err) {
    // Catch the error and return a fallback color
    logger.error(err)
    return '#b959b6'
  }
}
