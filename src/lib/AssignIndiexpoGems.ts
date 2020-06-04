import { Message, Snowflake, MessageReaction, User } from 'discord.js'
import async from 'async'
import { redis } from './Redis'
import logger from './Logger'

const INDIEXPO_MAX_MONTHLY_GEMS_PER_USER = 100

const incrementUserGems = async (userId: Snowflake) => {
  const key = `u:${userId}`
  const gems = parseInt(await redis.hget(key, 'indiexpo-gems'))
  const promises = []

  if (isNaN(gems) || gems < INDIEXPO_MAX_MONTHLY_GEMS_PER_USER) {
    promises.push(redis.hincrby(key, 'indiexpo-gems', 1))
    promises.push(redis.hincrby(key, 'indiexpo-gems-total', 1))
  }

  Promise.all(promises).catch((err: Error) => logger.error(err))
}

/**
 * Assign an Indiexpo gem to the user, for certain events
 */
export const assignIndiexpoGems = async (message: Message) => {
  const { content, author } = message
  const authorId = author.id

  // Create a react collector
  const reactiveUsers = []
  const filter = (reaction: MessageReaction, user: User) => (
    reaction.emoji.name === 'expo' && user.id === authorId
  )
  const collector = message.createReactionCollector(filter, { time: 1000 * 60 * 10 })
  collector.on('collect', (_, user) => {
    const { id } = user
    if (!reactiveUsers.includes(id)) incrementUserGems(id)
  })

  // Check if the message includes the word "indiexpo"
  const contentLowerCase = content.toLocaleLowerCase()
  if (contentLowerCase.includes('indiexpo') || contentLowerCase.includes('<:expo:714886068041941002>')) {
    return incrementUserGems(authorId)
  }
}

/**
 * Reset the users monthly indiexpo gems
 */
export const resetUsersMonthlyIndiexpoGems = async () => {
  // Get all the users
  const users = await redis.keys('u:*')

  // Reset the gems
  const tasks = []
  users.forEach(user => {
    tasks.push(async () => redis.hset(user, 'indiexpo-gems', 0))
  })
  await async.parallelLimit(tasks, 50)

  // Get the monthly gems
  // const tasks = []
  // users.forEach(user => {
  //   tasks.push(async () => redis.hget(user, 'indiexpo-gems'))
  // })
  // const gems = await async.parallelLimit(tasks, 50)
}
