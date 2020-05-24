import { Task } from '../lib/Queue'

export default {
  resolver: (text: string) => !!text && text !== 'cancel' && !text.startsWith('+'),

  handler: async ({ reply }: Task) => {
    await reply('non conosco questo comando. Scrivi `!help` per la lista dei comandi')
  }
}
