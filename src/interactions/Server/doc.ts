import { CommandInteraction } from 'discord.js'
import { InteractionConfig } from '../types'

export const docInteraction: InteractionConfig = {
  interaction: {
    name: 'doc',
    description: 'Linka il manuale di GameMaker Studio',
    options: [
      {
        name: 'query',
        type: 'STRING',
        description: 'Query di ricerca (solo per GMS 2)'
      },
      {
        name: 'version',
        type: 'STRING',
        description: 'Versione di GameMaker Studio (1 or 2)',
        choices: [
          { name: '2', value: '2' },
          { name: '1', value: '1' }
        ]
      }
    ]
  },

  handler: async (message: CommandInteraction) => {
    if (!message.options.size) {
      return await message.reply('https://manual.yoyogames.com')
    }

    // Get the option values
    let query: string
    let version = '2'
    for (const [name, opt] of message.options.entries()) {
      if (name === 'query') query = opt.value as string
      if (name === 'version') version = opt.value as string
    }

    if (version === '1') {
      return await message.reply('http://docs.yoyogames.com')
    }

    const searchUrl = 'https://manual.yoyogames.com/#t=Content.htm&ux=search&rhsearch=' + query
    await message.reply(searchUrl)
  }
}
