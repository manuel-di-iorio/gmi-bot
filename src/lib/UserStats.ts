import { Message, Snowflake, Guild } from 'discord.js'
import { redis } from './Redis'
import logger from './Logger'
import { filterExternalEmotes } from './utils/FilterExternalEmotes'

/** Save the most mentioend user */
const saveMostMentionedUser = async (message: Message) => {
  const userId = message.author.id
  const userKey = `u:${userId}`

  // Get the current count
  let mostMentionedUserCount: string | number | null = await redis.hget(userKey, 'most-mentioned-user-count')
  mostMentionedUserCount = mostMentionedUserCount ? parseInt(mostMentionedUserCount) : 0

  // Save the new count
  const promises = []
  message.mentions.members.size && message.mentions.members.forEach(guildMember => {
    if (guildMember.id === userId) return

    promises.push(async () => {
      const num = await redis.hincrby(`${userKey}:mentions`, guildMember.id, 1)
      if (num > mostMentionedUserCount) {
        await Promise.all([
          redis.hset(userKey, 'most-mentioned-user-count', num),
          redis.hset(userKey, 'most-mentioned-user', guildMember.displayName)
        ])
      }
    })
  })

  await Promise.all(promises.map(promise => promise()))
}

/** Save the most used emotes */
export const incrementMostUsedEmotes = async (emotes: string[], guild: Guild, userId: Snowflake) => {
  emotes = filterExternalEmotes(emotes, guild)

  const userKey = `u:${userId}`
  try {
    // Get the current count
    let mostUsedEmoteCount: string | number | null = await redis.hget(userKey, 'most-used-emote-count')
    mostUsedEmoteCount = mostUsedEmoteCount ? parseInt(mostUsedEmoteCount) : 0

    // Save the new count
    const promises = []
    emotes.forEach(emote => {
      promises.push(async () => {
        const num = await redis.hincrby(`${userKey}:emotes`, emote, 1)
        if (num > mostUsedEmoteCount) {
          await Promise.all([
            redis.hset(userKey, 'most-used-emote-count', num),
            redis.hset(userKey, 'most-used-emote', emote)
          ])
        }
      })
    })

    await Promise.all(promises.map(promise => promise()))
  } catch (err) {
    logger.error(err)
  }
}

const processIncrementMostUsedEmotes = async (message: Message) => {
  const allEmotes = message.content.match(/(<a*:[0-9a-zA-Z_]+:[0-9]+>)/g)
  if (!Array.isArray(allEmotes)) return
  const emotes = allEmotes.filter((v, idx, self) => self.indexOf(v) === idx) // Filter unique emotes
  await incrementMostUsedEmotes(emotes, message.guild, message.author.id)
}

/** Decrement the most used emote (when removing a reaction) */
export const decrementMostUsedEmotes = async (emotes: string[], guild: Guild, userId: Snowflake) => {
  emotes = filterExternalEmotes(emotes, guild)
  if (!emotes.length) return

  const userKey = `u:${userId}`
  try {
    // Get the current count
    let mostUsedEmoteCount: string | number | null = await redis.hget(userKey, 'most-used-emote-count')
    mostUsedEmoteCount = mostUsedEmoteCount ? parseInt(mostUsedEmoteCount) : 0
    if (mostUsedEmoteCount < 1) return
    await redis.hincrby(`${userKey}:emotes`, emotes[0], -1)
  } catch (err) {
    logger.error(err)
  }
}

/** Calculate the user stats */
export const calculateUserStats = async (message: Message) => {
  // Save the new stats
  const promises = [
    // Latest message date
    async (message: Message) => {
      await redis.hset(`u:${message.author.id}`, 'latest-msg-date', message.createdTimestamp)
    }
  ]

  promises.push(saveMostMentionedUser)
  promises.push(processIncrementMostUsedEmotes)

  try {
    await Promise.all(promises.map(promise => promise(message)))
  } catch (err) {
    logger.error(err)
  }
}
