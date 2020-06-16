import { Task } from '../../lib/Queue'

export default {
  resolver: (text: string) => text.startsWith('nick'),

  handler: async ({ message, text, reply }: Task) => {
    // Get the input
    const input = text.replace('nick', '').trim()
    if (!input) return reply('per cambiare il tuo nick, scrivi `!nick <nuovo nome>`')

    // Change the nickname
    try {
      await message.member.setNickname(input)
      await reply('il nickname è stato modificato')
    } catch (err) {
      if (err.code === 50013) return reply('sei troppo potente e non ho il permesso di cambiare il tuo nickname')
      throw err
    }
  }
}
