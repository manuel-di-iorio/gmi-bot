import { MessageEmbed, User, PartialUser } from 'discord.js'
import { getAvgColorFromImg } from './GetAvgColorFromImg'

/** Get the action embed */
export const getActionEmbed = async (user: User | PartialUser, title: string, description?: string): Promise<MessageEmbed> => {
  const avatarUrl = user.avatarURL({ format: 'png', size: 64 })
  const avatarColor = await getAvgColorFromImg(avatarUrl)

  const embed = new MessageEmbed()
  embed.setColor(avatarColor)
    .setThumbnail(avatarUrl)
    .setTitle(title)
  if (description) embed.setDescription(description)

  return embed
}
