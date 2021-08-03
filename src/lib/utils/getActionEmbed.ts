import { MessageEmbed, User, PartialUser, ColorResolvable } from 'discord.js'
import { getAvatarTopColor } from './getAvatarTopColor'

/** Get the action embed */
export const getActionEmbed = async (user: User | PartialUser, title: string, description?: string, footer?: string): Promise<MessageEmbed> => {
  const avatarUrl = user.avatarURL({ format: 'png', size: 64 })
  const avatarColor = await getAvatarTopColor(user)

  const embed = new MessageEmbed()
  embed.setColor(avatarColor as ColorResolvable)
    .setThumbnail(avatarUrl)
    .setTitle(title)
  if (description) embed.setDescription(description)
  if (footer) embed.setFooter(footer)

  return embed
}
