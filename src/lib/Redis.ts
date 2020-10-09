import IORedis from 'ioredis'
import { REDIS_URL, NODE_ENV } from './Config'
import logger from './Logger'

// Get the redis connection info
let REDIS_HOST: string
let REDIS_PORT: number
let REDIS_PASSWORD = ''

if (NODE_ENV === 'production') {
  const url = REDIS_URL.split(':')
  url.splice(0, 2)
  const redisAuth = url.shift().split('@')
  REDIS_PASSWORD = redisAuth.shift()
  REDIS_HOST = redisAuth.shift()
  REDIS_PORT = parseInt(url.shift())
} else {
  REDIS_HOST = 'localhost'
  REDIS_PORT = 6379
}

/** Create the Redis client */
export const redis = new IORedis({
  host: REDIS_HOST,
  password: REDIS_PASSWORD,
  port: REDIS_PORT,
  lazyConnect: true,
  retryStrategy: (times: number) => (times * 2000 + 2000)
})

redis.on('ready', () => logger.info('[REDIS] Ready'))

redis.on('error', (err: Error) => logger.error(err))

export const start = () => redis.connect()

/**
 * Recursively and progressively scan the redis keys
 */
export const scanKeys = async (
  pattern: string, cursor = '0', set: Set<string> = new Set(), stopOnNext = false
): Promise<Set<string>> => {
  const [currentCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100)
  for (let i = 0; i < keys.length; i++) {
    set.add(keys[i])
  }
  if (!stopOnNext) {
    return await scanKeys(pattern, currentCursor, set, currentCursor === '0')
  }
  return set
}
