import { browserWrapper } from '../../lib/Puppeteer'
import { Task } from '../../lib/Queue'

export default {
  cmd: 'doc',

  handler: async ({ text, reply, message }: Task) => {
    // if (!browserWrapper.browser) return reply('Errore: browser non ancora disponibile')
    return reply('https://manual.yoyogames.com')

    /* @todo

    // Get the input
    const input = text.replace('doc', '').trim().toLowerCase()
    if (!input) return reply('https://manual.yoyogames.com')

    // Load the main page
    const pages = await browserWrapper.browser.pages()
    const page = pages[0]
    await page.setViewport({ width: 1366, height: 768 })

    await page.goto('https://manual.yoyogames.com')

    // Go to the search page
    let selector = 'div.functionbar.sidebar-opened > div > a.fts.search-sidebar'
    await page.waitForSelector(selector)
    await page.click('div.functionbar.sidebar-opened > div > a.fts.search-sidebar')

    // Type the query
    selector = 'input.wSearchField'
    await page.waitForSelector(selector)
    await page.waitForTimeout(200)
    await page.type(selector, input)
    await page.keyboard.press('Enter')

    // Go to the search result page
    selector = '.wSearchURL > span'
    await page.waitForSelector(selector)
    const searchUrl = await page.$eval(selector, (element) => element.innerHTML)
    console.log(searchUrl)
    await page.goto(searchUrl)

    // await page.close() */
  }
}
