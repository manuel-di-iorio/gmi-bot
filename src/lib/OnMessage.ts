import { enqueue } from './Queue'
import { Message } from 'discord.js'
import { actions } from '../actions'
import { NODE_ENV, GMI_GUILD } from './Config'
import { addMessage } from './MessageStore'
import { deleteInvalidMsgInLimitedChannels } from './DeleteInvalidMsgInLimitedChannels'
import { updateEmotesCountInMessage } from './EmoteStore'
import { assignGmiRoleToNewActiveUsers } from './AssignGmiRole'
import { assignIndiexpoGems } from './AssignIndiexpoGems'
import { calculateUserStats } from './UserStats'

const botTrigger = NODE_ENV === 'production' ? '!' : '-'

export const onMessage = async (message: Message, content: string): Promise<void> => {
  // Only process bot commands
  if ((!content || content[0] !== botTrigger || content[1] === botTrigger) && !content.startsWith(',')) return
  const text = content.replace(botTrigger, '').trim()

  // Execute the action resolved based on the message content
  for (const [name, action] of actions) {
    if (action.resolver(text)) {
      enqueue({ action: name, message, text })
      break
    }
  }
}

export const onMessageOps = async (message: Message, content: string) => {
  if (message.guild?.id === GMI_GUILD) {
    // Log the message on the cache store
    addMessage(message)

    // Update the emotes count included into a message
    updateEmotesCountInMessage(message.guild, content)

    // Delete messages with invalid formats in limited channels
    deleteInvalidMsgInLimitedChannels(message, content)

    // Assign the GMI role to new active users
    assignGmiRoleToNewActiveUsers(message)

    // Assign Indiexpo Gems for certain events
    assignIndiexpoGems(message)

    // Calculate user stats
    calculateUserStats(message)
  }
}
