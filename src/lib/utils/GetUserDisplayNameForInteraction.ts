import { CommandInteraction, Message, Snowflake } from 'discord.js'

/**
 * Get the user display name
 */
export const getUserDisplayNameForInteraction = (message: CommandInteraction, user: Snowflake = message.user.id) => (
  message.guild ? message.guild.members.cache.get(user)?.displayName : message.user.username
)
