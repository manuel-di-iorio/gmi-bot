import { MessageReaction, User } from 'discord.js'
import { GMI_GUILD } from '../../Config'
import { decrReactCount } from '../../EmoteStore'
import { decrementMostUsedEmotes } from '../../UserStats'

export const messageReactionRemove = async (messageReaction: MessageReaction, user: User) => {
  if (messageReaction.message.guild?.id !== GMI_GUILD) return

  /* Update the reactions stats */
  decrReactCount(messageReaction.message.guild, messageReaction.emoji)

  // Decrement the user most used emotes
  decrementMostUsedEmotes([messageReaction.emoji.toString()], messageReaction.message.guild, user.id)
}
