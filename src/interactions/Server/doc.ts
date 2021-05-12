import { ApplicationCommandOptionType } from 'discord-api-types'
import { CommandInteraction, MessageAttachment } from 'discord.js'
import { browserWrapper } from '../../lib/Puppeteer'
import { NEWLINE } from '../../lib/utils/GetNewline'

export const docInteraction = {
  version: 0,
  oldVersion: 0,

  interaction: {
    name: 'doc',
    description: 'Linka il manuale di GameMaker Studio',
    options: [
      {
        name: 'query',
        type: ApplicationCommandOptionType.STRING,
        description: 'Query di ricerca (solo per GMS 2)'
      },
      {
        name: 'version',
        type: ApplicationCommandOptionType.STRING,
        description: 'Versione di GameMaker Studio (1 or 2)',
        choices: [
          { name: '2', value: '2' },
          { name: '1', value: '1' }
        ]
      }
    ]
  },

  handler: async (message: CommandInteraction) => {
    if (!message.options.length) {
      return await message.reply('https://manual.yoyogames.com')
    }

    // Get the option values
    let query: string
    let version = '2'
    for (const { name, value } of message.options) {
      if (name === 'query') query = value as string
      if (name === 'version') version = value as string
    }

    if (version === '1') {
      return await message.reply('http://docs.yoyogames.com')
    }

    const searchUrl = 'https://manual.yoyogames.com/#t=Content.htm&ux=search&rhsearch=' + query
    await message.reply(searchUrl)

    // await message.defer()

    // // Setup the browser page
    // const page = await browserWrapper.browser.newPage()
    // await page.setViewport({ width: 1366, height: 768 })

    // try {
    //   // Load the initial page
    //   await page.goto(searchUrl)

    //   // Click on the first search link
    //   const selector = 'body > div.searchresults.left-pane.search-sidebar.sidebar-opened.layout-visible > div.wSearchResultItemsBlock > div > div:nth-child(1) > a'
    //   await page.waitForSelector(selector)
    //   await page.click(selector, { delay: 50, clickCount: 3 })
    //   await page.waitForTimeout(2000)

    //   const buffer = await page.screenshot({ clip: { x: 365, y: 120, width: 1366 - 365, height: 768 - 120 } })
    //   const attachment = new MessageAttachment(buffer as Buffer, 'doc.png')
    //   // @ts-expect-error
    //   await message.editReply(searchUrl, attachment)
    // } finally {
    //   await page.close()
    // }
  }
}
