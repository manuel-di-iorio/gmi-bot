import { Snowflake } from 'discord-api-types'
import { TextChannel } from 'discord.js'
import { bot } from '..'
import { syncInteractionCommands } from '../../../interactions/syncInteractions'
import { GMI_GUILD, NODE_ENV } from '../../Config'
import logger from '../../Logger'
import { redis } from '../../Redis'

export const ready = (resolve: (value: void | PromiseLike<void>) => void) => () => {
  logger.info('[BOT] Ready')
  resolve()

  // Get the main channel
  const mainChannel = bot.channels.cache.get(GMI_GUILD as Snowflake) as TextChannel
  if (!mainChannel) throw new Error('Bot not found in the main channel')

  // Send a start message in dev
  NODE_ENV === 'development' && mainChannel.send('Connected').catch((err: Error) => logger.error(err))

  // Save a redis key for backup-control purposes
  redis.set('backup-control', '1').catch((err: Error) => logger.error(err))

  // Sync the interaction commands
  syncInteractionCommands(mainChannel)
}
