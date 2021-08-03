import { Snowflake } from 'discord.js'
import { redis } from '../lib/Redis'

/** Set the user display name */
export const setName = (id: Snowflake, displayName: string) => redis.hset(`u:${id}:info`, 'display-name', displayName)

/** Get the user display name */
export const getName = (id: Snowflake) => redis.hget(`u:${id}:info`, 'display-name')

/** Set the user color */
export const setColor = (id: Snowflake, color: string) => redis.hset(`u:${id}:info`, 'color', color)

/** Get the user color */
export const getColor = (id: Snowflake) => redis.hget(`u:${id}:info`, 'color')

/** Set the kick time */
export const setKickTime = (id: Snowflake, time: string) => redis.hset(`u:${id}:info`, 'kick-time', time)

/** Unset the kick time */
export const unsetKickTime = (id: Snowflake) => redis.hdel(`u:${id}:info`, 'kick-time')

/** Get the kick time */
export const getKickTime = (id: Snowflake) => redis.hget(`u:${id}:info`, 'kick-time')
