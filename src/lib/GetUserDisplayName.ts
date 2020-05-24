import { Message, Snowflake } from 'discord.js'

/**
 * Get the user display name
 */
export const getUserDisplayName = (message: Message, user: Snowflake = message.author.id) => (
  message.guild.members.cache.get(user).displayName
)
