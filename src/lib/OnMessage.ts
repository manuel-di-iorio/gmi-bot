import { enqueue } from './Queue'
import { Message } from 'discord.js'
import { actions } from '../actions'
import { NODE_ENV, GMI_GUILD } from './Config'
import { addMessage } from './MessageStore'
import { deleteInvalidMsgInLimitedChannels } from './DeleteInvalidMsgInLimitedChannels'
import { updateEmotesCountInMessage } from './EmoteStore'
import { assignGmiRoleToNewActiveUsers } from './AssignGmiRole'
import { calculateUserStats } from './UserStats'

const botTrigger = NODE_ENV === 'production' ? '!' : '-'

export const onMessage = async (message: Message, content: string): Promise<void> => {
  if ((message.guild && message.guild.id !== GMI_GUILD) || !content) return

  // Strip the trigger char when detected
  const triggerCmd = content[0] === botTrigger && content[1] !== botTrigger
  if (!triggerCmd && content[0] !== ',') return
  if (triggerCmd) content = content.slice(1)
  content = content.trim()

  // Execute the action resolved based on the message content
  for (const [name, { cmd, resolver }] of actions) {
    // Resolve the command
    if (
      (cmd && Array.isArray(cmd) ? cmd.find(item => content.startsWith(item)) : content.startsWith(cmd as string)) ||
      (resolver && resolver(content, message, message.reply))
    ) {
      enqueue({ action: name, message, text: content })
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

    // Calculate user stats
    calculateUserStats(message)
  }
}
