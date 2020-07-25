/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-undef */
import { job } from 'parallelcode'
import { redis } from '../../lib/Redis'
import { getUserDisplayName } from '../../lib/utils/GetUserDisplayName'
import logger from '../../lib/Logger'
import { Task } from '../../lib/Queue'
import { spellcheck } from '../../lib/Spellcheck'

export default {
  resolver: (text: string) => text !== 'cancel' && !text.startsWith(','),

  handler: async ({ text, reply, message }: Task) => {
    // Iterate over the custom commands
    const displayName = getUserDisplayName(message)
    let endSep = text.indexOf(' ')
    if (endSep === -1) endSep = text.length
    const cmd = text.slice(0, endSep)
    const cmdCode = await redis.hget('cmd:list', cmd)

    // Command not found
    if (!cmdCode) {
      const correction = spellcheck.getCorrection(text)
      const correctionText = correction ? `, forse stavi cercando \`!${correction}\` ?` : '.'
      return reply(`non conosco questo comando${correctionText}
Scrivi \`!help\` per la lista dei comandi`)
    }

    const [isDisabled, usageCount] = await Promise.all([
      redis.hget('cmd:disabled', cmd),
      redis.get(`cmd:usage:${cmd}`)
    ])
    const usageCountNum = parseInt(usageCount)

    // Check if the command is disabled or under heavy usage
    if (isDisabled || usageCountNum > 5) {
      logger.warn(`[CUSTOM CMD] Command '${cmd}' is disabled or under heavy usage`)

      // Disable the custom command if usage is too exceeded
      if (usageCountNum > 10) {
        const status = JSON.stringify({ userId: message.author.id, userNick: displayName, disabledAt: new Date() })
        await redis.hset('cmd:disabled', cmd, status)
        await reply(`il comando '${cmd}' è stato disabilitato per l'eccessivo uso in breve tempo`)
        return true
      }

      await reply(`il comando '${cmd}' è disabilitato o richiede tempo prima di poterlo chiamare di nuovo`)
      return true
    }

    // Increment the usage count
    redis.incr(`cmd:usage:${cmd}`).catch((err: Error) => logger.error(err))
    redis.expire(`cmd:usage:${cmd}`, 10).catch((err: Error) => logger.error(err))

    // Execute the command
    try {
      const data = {
        data: {
          cmdCode,
          text: message.content.replace('!' + cmd, '').trim(),
          authorId: message.author.id,
          authorNick: displayName,
          authorUsername: message.author.username,
          channelId: message.channel.id,
          channelName: message.channel.toString()
        }
      }

      const context = await job(({ data: { cmdCode, text, authorId, authorNick, authorUsername, channelId, channelName } }) => {
        process.on('uncaughtException', console.error)
        process.on('unhandledRejection', console.error)

        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { VM } = require('vm2')
        const vmAsync = new VM({ // eslint-disable-line
          console: 'off',
          timeout: 1000 * 3,
          sandbox: { text, authorId, authorNick, authorUsername, channelId, channelName },
          eval: false,
          wasm: false,
          fixAsync: true
        })

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return vmAsync.run(cmdCode)
      }, data)
      const { result } = await context.onDone
      if (result) {
        await message.channel.send(result)
        return true
      }
    } catch (err) {
      await reply(`errore nell'esecuzione: ${err.message}`)
      return true
    }
  }
}
