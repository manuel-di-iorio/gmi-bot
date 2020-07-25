import zlib from 'zlib'
import { promisify } from 'util'
import axios from 'axios'
import { Task } from '../../lib/Queue'
import logger from '../../lib/Logger'
import { BOT_AUTHOR_ID } from '../../lib/Config'
import { dropbox } from '../../lib/Dropbox'
import { redis } from '../../lib/Redis'

const gunzipAsync = promisify(zlib.gunzip.bind(zlib))

const restoreDb = async () => {
  // Get the db from the backup file
  const { link } = await dropbox.filesGetTemporaryLink({ path: '/backup.gz' })
  const { data: compressedDb } = await axios(link, { responseType: 'arraybuffer' })
  const records = JSON.parse(await gunzipAsync(compressedDb))

  // Import the records in the database
  const promises = []
  const startTime = Date.now()

  for (let i = 0; i < records.length; i++) {
    const { type, key, value } = records[i]

    promises.push(async () => {
      let fields
      await redis.del(key)

      switch (type) {
        case 'string':
          await redis.set(key, value)
          break

        case 'hash':
          fields = []
          for (const fieldKey in value) {
            fields.push(fieldKey)
            fields.push(value[fieldKey])
          }
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          await redis.hset(key, ...fields)
          break

        case 'list':
          await redis.lpush(key, ...value.reverse())
          break

        case 'zset':
          fields = []
          for (let i = 0; i < value.length; i += 2) {
            fields.push(value[i])
            fields.push(value[i] + 1)
          }
          await redis.zadd(key, ...fields)
          break
      }
    })
  }

  await Promise.all(promises.map(promise => promise()))
  logger.debug(`[BOT:RESTORE] Backup processed in ${Date.now() - startTime}ms`)
}

export default {
  cmd: 'bot:restore',

  handler: async ({ message, reply }: Task) => {
    // User roles authorization (only for the bot author)
    if (message.author.id !== BOT_AUTHOR_ID) return reply('non sei autorizzato ad usare questo comando')

    // Restore the database
    await restoreDb()
    const replyMsg = await reply('il database è stato ripristinato')

    if (message.guild) {
      setTimeout(async () => {
        try {
          await Promise.all([
            message.delete(),
            replyMsg.delete()
          ])
        } catch (err) {
          logger.error(err)
        }
      }, 2000)
    }
  }
}
