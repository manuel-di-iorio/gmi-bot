import { Message, Snowflake } from 'discord.js'
import async from 'async'
import { redis } from './Redis'
import logger from './Logger'

const INDIEXPO_MAX_MONTHLY_GEMS_PER_USER = 100

export const incrementUserGems = async (userId: Snowflake) => {
  const key = `u:${userId}`
  const gems = parseInt(await redis.hget(key, 'indiexpo-gems'))
  const promises = []

  if (isNaN(gems) || gems < INDIEXPO_MAX_MONTHLY_GEMS_PER_USER) {
    promises.push(redis.hincrby(key, 'indiexpo-gems', 1))
    promises.push(redis.hincrby(key, 'indiexpo-gems-total', 1))
  }

  Promise.all(promises).catch((err: Error) => logger.error(err))
}

export const decrementUserGems = async (userId: Snowflake) => {
  const key = `u:${userId}`
  const gems = parseInt(await redis.hget(key, 'indiexpo-gems'))
  const promises = []

  if (isNaN(gems) || gems > 0) {
    promises.push(redis.hincrby(key, 'indiexpo-gems', -1))
    promises.push(redis.hincrby(key, 'indiexpo-gems-total', -1))
  }

  Promise.all(promises).catch((err: Error) => logger.error(err))
}

/**
 * Assign an Indiexpo gem to the user, for certain events
 */
export const assignIndiexpoGems = async (message: Message) => {
  const { content, author } = message
  const authorId = author.id

  // Check if the message includes the word "indiexpo"
  const contentLowerCase = content.toLocaleLowerCase()
  if (contentLowerCase.includes('indiexpo') || contentLowerCase.includes('<:expo:714886068041941002>')) {
    await incrementUserGems(authorId)
  }
}

/**
 * Reset the users monthly indiexpo gems
 */
export const resetUsersMonthlyGems = async () => {
  if (new Date().getDate() > 3) return

  // Get all the users
  const users = await redis.keys('u:*')

  // Reset the gems
  const tasks = []
  users.forEach(user => {
    tasks.push(async () => redis.hset(user, 'indiexpo-gems', 0))
  })
  await async.parallelLimit(tasks, 50)
}
