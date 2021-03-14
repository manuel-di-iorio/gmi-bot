import { js as beautify } from 'js-beautify'
import { Task } from '../../lib/Queue'
import { getUserDisplayName } from '../../lib/utils/GetUserDisplayName'

const formatOpts = {
  indent_size: 4,
  space_in_empty_paren: true
}

export default {
  cmd: 'code',

  handler: async ({ text, reply, message }: Task) => {
    const code = text.replace('code', '').trim()

    if (!code) return reply("scrivi il codice da formattare. Esempio: `!code show_message('Ciao')`")

    try {
      const result = beautify(code, formatOpts)
      const promises = [message.channel.send(`\`\`\`gml
// Scritto da ${getUserDisplayName(message)} con !code
${result}
\`\`\`
`)]

      if (message.guild) promises.push(message.delete())

      await Promise.all(promises)
    } catch (err) {
      await reply(`è avvenuto un errore nella formattazione del codice: ${err.message}`)
    }
  }
}
