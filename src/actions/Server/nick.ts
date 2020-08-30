import { Task } from '../../lib/Queue'
import { GMI_GUILD } from '../../lib/Config'

export default {
  cmd: 'nick',

  handler: async ({ message, text, reply }: Task) => {
    // Get the input
    const input = text.replace('nick', '').trim()
    if (!input) return reply('per cambiare il tuo nick, scrivi `!nick <nuovo nome>`')
    if (input.length > 32) return reply('il nick può contenere max 32 caratteri')

    // Change the nickname
    try {
      await message.member.setNickname(input)
      if (message.guild.id !== GMI_GUILD) await reply('il nickname è stato modificato')
    } catch (err) {
      switch (err.code) {
        case 50013: return reply('non ho il permesso di cambiare il nickname agli admin')
        case 50035: return reply('il nick può contenere max 32 caratteri')
      }
      throw err
    }
  }
}
