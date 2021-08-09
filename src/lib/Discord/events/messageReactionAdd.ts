import { MessageReaction, User } from 'discord.js'
import { GMI_GUILD } from '../../Config'
import { incrReactCount } from '../../EmoteStore'
import { incrementMostUsedEmotes } from '../../UserStats'

export const messageReactionAdd = async (messageReaction: MessageReaction, user: User) => {
  if (messageReaction.message.guild?.id !== GMI_GUILD) return

  // Update the reactions stats
  incrReactCount(messageReaction.message.guild, messageReaction.emoji)

  // Increment the user most used emotes
  incrementMostUsedEmotes([messageReaction.emoji.toString()], messageReaction.message.guild, user.id)
}
