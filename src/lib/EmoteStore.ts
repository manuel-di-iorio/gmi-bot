import { GuildEmoji, ReactionEmoji, Guild } from 'discord.js'
import logger from './Logger'
import { redis } from './Redis'

/** Dirty negative count fix  */
// const fixNegativeScores = async (guildId: string, reactId: string): Promise<void> => {
//   const reactCount = parseInt(await redis.zscore('emotes', reactId))
//   if (reactCount < 0) {
//     await redis.zrem('emotes', reactId)
//     await redis.zadd('emotes', 0, reactId)
//   }
// }

/** Increment a reaction count */
export const incrReactCount = async (guild: Guild, react: GuildEmoji | ReactionEmoji): Promise<void> => {
  if (!react.id) return // Only guild emoji can be stored
  if (!guild.emojis.cache.has(react.id)) return // External emojis cannot be stored

  const reactId = react.toString()
  try {
    await redis.zincrby('emotes', 1, reactId)
  } catch (err) {
    logger.error(err)
  }
}

export const decrReactCount = async (guild: Guild, react: GuildEmoji | ReactionEmoji): Promise<void> => {
  if (!react.id) return // Only guild emoji can be stored
  if (!guild.emojis.cache.has(react.id)) return // External emojis cannot be stored
  const reactId = react.toString()

  try {
    await redis.zincrby('emotes', -1, reactId)
  } catch (err) {
    logger.error(err)
  }
}

/** Update the emotes count contained into a message */
export const updateEmotesCountInMessage = async (guild: Guild, content: string): Promise<void> => {
  const allEmotes = content.match(/(<a*:[0-9a-zA-Z_]+:[0-9]+>)/g)
  if (!Array.isArray(allEmotes)) return
  const emotes = allEmotes.filter((v, idx, self) => self.indexOf(v) === idx)

  try {
    const tasks = emotes.map(async emoteString => {
      // Filter external emotes
      let emoteId = emoteString.split(':')[2]
      emoteId = emoteId.substr(0, emoteId.length - 1)
      if (!guild.emojis.cache.has(emoteId)) return

      // Increment the score
      await redis.zincrby('emotes', 1, emoteString)
    })

    await Promise.all(tasks)
  } catch (err) {
    logger.error(err)
  }
}
