// import { MessageAttachment } from 'discord.js'
// import { js as beautify } from 'js-beautify'
// import logger from '../../lib/Logger'
// import { Task } from '../../lib/Queue'
// import { getUserDisplayName } from '../../lib/utils/GetUserDisplayName'

// const formatOpts = {
//   indent_size: 2,
//   space_in_empty_paren: true,
//   brace_style: 'collapse'
// }

// export default {
//   cmd: 'code',

//   handler: async ({ text, reply, message }: Task) => {
//     const code = text.replace('code', '').trim()

//     if (!code) return reply("scrivi il codice da formattare. Esempio: `!code show_message('Ciao')`")

//     let formattedCode = code
//     try {
//       formattedCode = beautify(code, formatOpts)
//     } catch (err) {
//       logger.debug(`è avvenuto un errore nella formattazione del codice: ${err.message}`)
//     }

//     const buffer = Buffer.from(formattedCode, 'utf8')

//     const promises = [message.channel.send(new MessageAttachment(buffer, `${getUserDisplayName(message)}.js`))]
//     if (message.guild) promises.push(message.delete())
//     return await Promise.all(promises)
//   }
// }

import { js as beautify } from 'js-beautify'
import { Task } from '../../lib/Queue'
import { getUserDisplayName } from '../../lib/utils/GetUserDisplayName'

const formatOpts = {
  indent_size: 2,
  space_in_empty_paren: true,
  brace_style: 'collapse'
  // brace_style: 'expand'
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
