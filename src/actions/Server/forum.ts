import { readFileSync } from 'fs'
import { join } from 'path'
import { Task } from '../../lib/Queue'
import { MessageAttachment } from 'discord.js'
import logger from '../../lib/Logger'

// Load the background
const buffer = readFileSync(join(__dirname, '..', '..', '..', 'assets', 'forum-signup.png'))
const attachment = new MessageAttachment(buffer)

export default {
  cmd: 'forum',

  handler: async ({ reply, message }: Task) => {
    if (message.guild) message.delete().catch((err: Error) => logger.error(err))
    return reply('la risposta per iscriversi sul forum è `trenta-sei`', attachment)
  }
}
