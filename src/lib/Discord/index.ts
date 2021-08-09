import { Client, Message, Intents } from 'discord.js'
import { BOT_TOKEN } from '../Config'
import logger from '../Logger'
import { onMessage, onMessageOps } from '../OnMessage'
import { addMessage } from '../MessageStore'
import { deleteInvalidMsgInLimitedChannels } from '../DeleteInvalidMsgInLimitedChannels'
import { guildMemberAdd } from './events/guildMemberAdd'
import { guildMemberRemove } from './events/guildMemberRemove'
import { guildBanAdd } from './events/guildBanAdd'
import { messageReactionRemove } from './events/messageReactionRemove'
import { messageReactionAdd } from './events/messageReactionAdd'
import { guildMemberUpdate } from './events/guildMemberUpdate'
import { interactionCreate } from './events/interactionCreate'
import { ready } from './events/ready'

const { FLAGS } = Intents

export const bot = new Client({
  intents: [
    FLAGS.GUILDS,
    FLAGS.GUILD_PRESENCES,
    FLAGS.GUILD_MEMBERS,
    FLAGS.GUILD_EMOJIS_AND_STICKERS,
    FLAGS.GUILD_BANS,
    FLAGS.GUILD_INTEGRATIONS,
    FLAGS.GUILD_WEBHOOKS,
    FLAGS.GUILD_INVITES,
    FLAGS.GUILD_VOICE_STATES,
    FLAGS.GUILD_PRESENCES,
    FLAGS.GUILD_MESSAGES,
    FLAGS.GUILD_MESSAGE_REACTIONS,
    FLAGS.GUILD_MESSAGE_TYPING,
    FLAGS.DIRECT_MESSAGES,
    FLAGS.DIRECT_MESSAGE_REACTIONS,
    FLAGS.DIRECT_MESSAGE_TYPING
  ]
})

const isReady = new Promise<void>(resolve => {
  bot.on('ready', ready(resolve))
})

bot.on('interactionCreate', interactionCreate)

bot.on('error', (err: Error) => {
  logger.error('[DISCORD] Generic error', err)
})

bot.on('messageCreate', (message) => {
  if (message.author.bot) return
  const content = message.content.trim()
  onMessage(message, content)
  onMessageOps(message, content)
})

bot.on('messageUpdate', (oldMessage, newMessage) => {
  if (newMessage.author.bot) return
  addMessage(newMessage as Message, newMessage.cleanContent + ' [Modificato]', newMessage.editedAt || newMessage.createdAt)

  // Delete messages with invalid formats in limited channels
  deleteInvalidMsgInLimitedChannels(newMessage as Message)
})

bot.on('messageDelete', (message) => {
  if (message.author.bot) return
  addMessage(message as Message, message.cleanContent + ' [Cancellato]', new Date())
})

/* Say hello to new members */
bot.on('guildMemberAdd', guildMemberAdd)

/* Log people leaving the server */
bot.on('guildMemberRemove', guildMemberRemove)

/* Bans manager */
bot.on('guildBanAdd', guildBanAdd)
bot.on('guildBanRemove', guildMemberRemove)

// Store the updated users roles
bot.on('guildMemberUpdate', guildMemberUpdate)

// Reactions manager
bot.on('messageReactionAdd', messageReactionAdd)
bot.on('messageReactionRemove', messageReactionRemove)

// Connect to Discord
export const start = async () => {
  await bot.login(BOT_TOKEN)
  await isReady
}
