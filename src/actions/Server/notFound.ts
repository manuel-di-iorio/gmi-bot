import { Task } from '../../lib/Queue'
import { spellcheck } from '../../lib/Spellcheck'

export default {
  resolver: (text: string) => !!text && text !== 'cancel' && !text.startsWith('+'),

  handler: async ({ text, reply }: Task) => {
    const correction = spellcheck.getCorrection(text)
    const correctionText = correction ? `, forse stavi cercando \`!${correction}\` ?` : '.'
    return reply(`non conosco questo comando${correctionText}
Scrivi \`!help\` per la lista dei comandi`)
  }
}
