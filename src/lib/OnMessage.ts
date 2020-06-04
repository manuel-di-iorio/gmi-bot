import { enqueue } from './Queue'
import { Message } from 'discord.js'
import { actions } from '../actions'
import { NODE_ENV, GMI_GUILD } from './Config'
import { addMessage } from './MessageStore'
import { deleteInvalidMsgInLimitedChannels } from './DeleteInvalidMsgInLimitedChannels'
import { updateEmotesCountInMessage } from './EmoteStore'
import { assignGmiRoleToNewActiveUsers } from './AssignGmiRole'
import { assignIndiexpoGems } from './AssignIndiexpoGems'

const botTrigger = NODE_ENV === 'production' ? '!' : '-'

export const onMessage = async (message: Message): Promise<void> => {
  if (message.author.bot) return

  // Get the clean content
  const content = message.content.trim()

  if (message.guild?.id === GMI_GUILD) {
    // Log the message on the cache store
    addMessage(message)

    // Update the reacts count contained into a message
    updateEmotesCountInMessage(message.guild, content)

    // Delete messages with invalid formats in limited channels
    deleteInvalidMsgInLimitedChannels(message, content)

    // Assign the GMI role to new active users
    assignGmiRoleToNewActiveUsers(message)

    // Assign Indiexpo Gems for certain events
    assignIndiexpoGems(message)
  }

  // Only process bot commands
  if ((!content || !content.startsWith(botTrigger) || content[1] === botTrigger) && !content.startsWith(',')) return
  const text = content.replace(botTrigger, '').trim()

  // Execute the action resolved based on the message content
  for (const [name, action] of actions) {
    if (action.resolver(text)) {
      enqueue({ action: name, message, text })
      break
    }
  }
}
