import { Task, enqueue } from '../../lib/Queue'
import { getCorrection } from '../../lib/Spellcheck'
import { askReactConfirm } from '../../lib/utils/AskReactConfirm'

export default {
  resolver: (text: string) => !!text && text !== 'cancel' && !text.startsWith('+'),

  handler: async (task: Task) => {
    const { text, reply, message } = task

    const correction = getCorrection(text)
    if (!correction) return reply('non conosco questo comando. Scrivi `!help` per la lista dei comandi')

    const reactText = `non conosco questo comando, forse stavi cercando \`!${correction.cmd}\` ?
Conferma premendo la reazione o scrivi \`!help\` per la lista dei comandi`
    if (!await askReactConfirm(message, { text: reactText })) return

    // Enqueue the auto corrected action
    message.content = `!${correction.cmd}`

    enqueue({
      ...task,
      action: correction.action,
      text: correction.cmd
    })
  }
}
