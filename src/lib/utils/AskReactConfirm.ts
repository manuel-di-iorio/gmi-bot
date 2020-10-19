import { MessageReaction, User, Message } from 'discord.js'

/**
 * Ask the confirmation for an action by using a reaction reply
 */
export const askReactConfirm = async (
  message: Message,
  { text, time }: { text: string; time?: number }
): Promise<boolean> => {
  if (!time) time = 20000
  const { id: authorId } = message.author

  // Define the collector filter
  const filter = (reaction: MessageReaction, user: User) => (
    (reaction.emoji.name === '✅' || reaction.emoji.name === '❌') && user.id === authorId
  )

  const replyMsg = await message.reply(text)

  // Create the confirm collector
  let isReactPressed = false
  const collector = replyMsg.createReactionCollector(filter, { time })

  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    collector.on('collect', (messageReaction: MessageReaction) => {
      if (isReactPressed) return
      isReactPressed = true
      collector.stop(messageReaction.emoji.name === '✅' ? 'confirm' : 'cancel')
    })

    collector.on('end', async (_, reason) => {
      try {
        await replyMsg.delete()
      } catch (err) {
        return reject(err)
      }

      resolve(reason === 'confirm')
    })

    // Add the reactions
    try {
      await Promise.all([replyMsg.react('✅'), replyMsg.react('❌')])
    } catch (err) {
      collector.removeAllListeners()
      collector.stop()
      reject(err)
    }
  })
}
