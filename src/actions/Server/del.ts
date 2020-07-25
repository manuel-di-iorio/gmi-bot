import { Message } from 'discord.js'
import { Task } from '../../lib/Queue'
import { isAuthorized } from '../../lib/utils/IsAuthorized'
import { askReactConfirm } from '../../lib/utils/AskReactConfirm'

export default {
  cmd: 'del',

  handler: async ({ text, reply, message }: Task) => {
    // Get a cloned copy of the latest channel messages
    const clonedMessages = Array.from((await message.channel.messages.fetch()).values())

    // Guild check
    if (!message.guild) return reply(`Scusa ${message.author.username} ma questo comando non è disponibile qui.`)

    // User rols authorization (only admins and mods)
    if (!isAuthorized(message)) return reply('non sei autorizzato ad usare questo comando')

    // Get the input
    const input = text.replace('del', '').trim().toLowerCase()
    if (!input) {
      return reply(`specifica il numero di messaggi da cancellare oppure una stringa contenuta in un messaggio fino a cui cancellare. 
      
Esempio:
\`!del 4\` Cancella gli ultimi 4 messaggi di questo canale
\`!del pizza stasera\` Cancella i messaggi fino a che non ne trova uno che contiene 'pizza stasera'`)
    }

    /** Ask the confirm to the user */
    const askConfirmToUser = async (count: number, messages: Message[] | number = count) => {
      const msgTextPlural = count === 1 ? 'o' : ''
      const confirmed = await askReactConfirm(message, {
        text: `stai per cancellare ${count} messaggi${msgTextPlural} (scritti prima del tuo comando !del). Confermi ?`
      })

      if (confirmed) await message.channel.bulkDelete(messages)
    }

    // Get the messages to delete
    let count = parseInt(input)
    if (!isNaN(count)) {
      // Filter by count
      if (count < 1) {
        return reply('specifica un numero maggiore di 0')
      } else if (count > 50) {
        return reply('puoi cancellare max 50 messaggi')
      } else {
        return askConfirmToUser(count, clonedMessages.slice(1, count + 1))
      }
    } else {
      // Filter by text
      const messages: Message[] = []

      // Find the string into the channel messages
      clonedMessages.some((channelMsg: Message) => {
        if (channelMsg.id === message.id) return false
        if (channelMsg.deleted || !channelMsg.deletable) return false
        messages.push(channelMsg)
        return channelMsg.content.toLowerCase().includes(input)
      })

      // Delete the messages
      count = messages.length
      if (!count) {
        return reply('non ci sono messaggi da cancellare')
      } else {
        return askConfirmToUser(count, messages)
      }
    }
  }
}
