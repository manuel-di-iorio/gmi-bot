import { Snowflake } from 'discord.js'
import { redis } from '../lib/Redis'

/** Create a discussion channel (can also be used to extend the expiration) */
export const createOrExtend = (userId: Snowflake, channelId: string) =>
  redis.set(`disc:${userId}`, JSON.stringify({ id: channelId, expiresAt: +new Date(+new Date() + 1000 * 60 * 60 * 6) }))

/** Remove a discussion channel */
export const remove = (userId: Snowflake) => redis.del(`disc:${userId}`)

/** Get the user discussion channel */
export const getByUser = async (userId: Snowflake) => {
  const discussion = await redis.get(`disc:${userId}`)
  if (!discussion) return
  return JSON.parse(discussion)
}
