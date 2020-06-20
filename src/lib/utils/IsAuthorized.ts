import { Message } from 'discord.js'
import { GMI_ADMIN_ROLES, BOT_AUTHOR_ID } from '../Config'

export const isAuthorized = (message: Message) => {
  const userRoles = message.guild.members.cache.get(message.author.id).roles.cache
  return message.author.id === BOT_AUTHOR_ID || message.guild.ownerID === message.author.id || userRoles.some(role => GMI_ADMIN_ROLES.includes(role.id))
}
