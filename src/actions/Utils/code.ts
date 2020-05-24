import { js as beautify } from 'js-beautify'
import { Task } from '../../lib/Queue'
import { getUserDisplayName } from '../../lib/GetUserDisplayName'

const formatOpts = {
  // eslint-disable-next-line @typescript-eslint/camelcase
  indent_size: 4,
  // eslint-disable-next-line @typescript-eslint/camelcase
  space_in_empty_paren: true
}

export default {
  resolver: (text: string) => text.startsWith('code'),

  handler: async ({ text, reply, message }: Task) => {
    const code = text.replace('code', '').trim()

    try {
      const result = beautify(code, formatOpts)
      const promises = [message.channel.send(`\`\`\`csharp
${result}

// Scritto da ${getUserDisplayName(message)} con !code
\`\`\`
`)]

      if (message.guild) promises.push(message.delete())

      await Promise.all(promises)
    } catch (err) {
      await reply(`è avvenuto un errore nella formattazione del codice: ${err.message}`)
    }
  }
}
