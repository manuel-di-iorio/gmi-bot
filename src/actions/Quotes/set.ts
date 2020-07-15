import { Task } from '../../lib/Queue'
import { redis } from '../../lib/Redis'
import { askReactConfirm } from '../../lib/utils/AskReactConfirm'
import { askMsgReply } from '../../lib/utils/AskMsgReply'

export default {
  resolver: (text: string) => text.startsWith('set'),

  handler: async ({ text, reply, message }: Task) => {
    const input = text.replace('set', '').trim()
    if (!input) {
      return reply('manca il nome della citazione che vuoi salvare')
    }

    const inputSplit = input.split('|')
    const quoteName = inputSplit.shift().trim()

    // Check if already exists
    if (await (redis.hexists('quotes', quoteName))) {
      const confirmed = await askReactConfirm(message, { text: 'esiste già questa citazione, vuoi sovrascriverla ?' })
      if (!confirmed) return
    }

    // Ask the quote value
    const value = inputSplit.length ? inputSplit.shift().trim() : await askMsgReply(message, { text: 'qual è il testo della citazione ?' })
    if (!value) return

    // Save the ne quote
    await redis.hset('quotes', quoteName, value)
    await reply(`ho salvato la citazione! Puoi mostrarla scrivendo \`,${quoteName}\``)
  }
}
