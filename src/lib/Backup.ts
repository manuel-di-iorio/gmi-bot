/* eslint-disable @typescript-eslint/no-explicit-any */
import zlib from 'zlib'
import { promisify } from 'util'
import { BACKUP_ENABLED, BOT_AUTHOR_ID } from './Config'
import { redis } from './Redis'
import logger from './Logger'
import { parallelLimit } from 'async'
import { dropbox } from './Dropbox'
import { bot } from './Discord'
import { NEWLINE } from './utils/GetNewline'
import { Snowflake } from 'discord.js'

const gzipAsync = promisify(zlib.gzip.bind(zlib))

/** Recursively get the redis keys */
const getKeys = async (cursor: string, set: Set<string>, stopOnNext = false) => {
  const [scanCursor, scanKeys] = await redis.scan(cursor, 'COUNT', 100)
  for (let i = 0; i < scanKeys.length; i++) {
    set.add(scanKeys[i])
  }
  if (!stopOnNext) await getKeys(scanCursor, set, scanCursor === '0')
}

/** Execute a backup uploading the file on dropbox */
export const execBackup = async () => {
  if (!BACKUP_ENABLED) return

  logger.debug('[BACKUP] Started')
  const startTime = +new Date()
  const db = []

  // Get the keys
  const set: Set<string> = new Set()
  await getKeys('0', set)

  // Get the values
  const promises = []
  for (const key of set) {
    promises.push(async () => {
      const type = await redis.type(key)
      let value: any
      let zset: any[]

      switch (type) {
        case 'string':
          value = await redis.get(key)
          db.push({ type: 'string', key, value })
          break

        case 'hash':
          value = await redis.hgetall(key)
          db.push({ type: 'hash', key, value })
          break

        case 'list':
          value = await redis.lrange(key, 0, -1)
          db.push({ type: 'list', key, value })
          break

        case 'zset':
          value = await redis.zrange(key, 0, -1, 'WITHSCORES')
          zset = []
          for (let z = 0; z < value.length; z += 2) {
            zset.push(value[1])
            zset.push(value[0])
          }

          db.push({ type: 'zset', key, value: zset })
          break
      }
    })
  }
  await parallelLimit(promises, 50)

  // Compress the backup content
  const compressedDb = await gzipAsync(Buffer.from(JSON.stringify(db)))

  // Upload the file to Dropbox
  await dropbox.filesUpload({
    contents: compressedDb,
    path: '/backup.gz',
    mode: { '.tag': 'overwrite' },
    mute: true
  })

  logger.debug(`[BACKUP] Completed in ${+new Date() - startTime}ms`)
}

/** Check the database status on redis, by asserting the backup-control key */
export const dbControl = async () => {
  const botAuthor = bot.users.cache.get(BOT_AUTHOR_ID as Snowflake)
  if (!botAuthor) return
  const controlKey = await redis.exists('backup-control')
  if (!controlKey) {
    logger.error('[REDIS] DATABASE CONTROL KEY NOT FOUND')
    await botAuthor.send('⚠️ **BOT EMERGENCY** ⚠️' + NEWLINE + '```DATABASE CONTROL KEY NOT FOUND```')
  }
}
