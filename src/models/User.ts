import { redis } from '../lib/Redis'

/** Set the user display name */
export const setName = (id: string, displayName: string) => redis.hset(`u:${id}:info`, 'display-name', displayName)

/** Get the user display name */
export const getName = (id: string) => redis.hget(`u:${id}:info`, 'display-name')
