import puppeteer, { Browser } from 'puppeteer'
import logger from './Logger'

export const browserWrapper: { browser: Browser } = { browser: null }

export const start = async () => {
  // browserWrapper.browser = await puppeteer.launch({ headless: false })
  logger.info('[PUPPETEER] READY')
}
