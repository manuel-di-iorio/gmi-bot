import { Client, TextChannel, Message, MessageEmbed } from 'discord.js'
import { BOT_TOKEN, GMI_GUILD, NODE_ENV } from './Config'
import logger from './Logger'
import { onMessage, onMessageOps } from './OnMessage'
import { isCpbotOnline } from './IsCpbotOnline'
import { storeMemberRoles, retrieveMemberRoles } from './RoleStore'
import { incrReactCount, decrReactCount } from './EmoteStore'
import { incrementMostUsedEmotes, decrementMostUsedEmotes } from './UserStats'
import { redis } from './Redis'
import { addMessage } from './MessageStore'
import { getActionEmbed } from './utils/getActionEmbed'
import { deleteInvalidMsgInLimitedChannels } from './DeleteInvalidMsgInLimitedChannels'
import * as UserModel from '../models/User'

export const bot = new Client()
let mainChannel: TextChannel

/** Map of temporary disabled nickname change updates */
const disabledNicknameUpdates = {}

const isReady = new Promise(resolve => {
  bot.on('ready', () => {
    logger.info('[BOT] Ready')
    resolve()

    // Get the main channel
    mainChannel = bot.channels.cache.get(GMI_GUILD) as TextChannel

    // Send a start message in dev
    NODE_ENV === 'development' && mainChannel.send('Connected').catch((err: Error) => logger.error(err))

    // Save a redis key for backup-control purposes
    redis.set('backup-control', '1').catch((err: Error) => logger.error(err))

    // Set the bot activity
    bot.user.setActivity('!help').catch((err: Error) => logger.err(err))
    setInterval(() => bot.user.setActivity('!help').catch((err: Error) => logger.err(err)), 1000 * 60 * 60)
  })
})

// bot.on('debug', console.debug)

bot.on('error', (err: Error) => {
  logger.error('[DISCORD] Generic error', err)
})

bot.on('message', (message) => {
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
bot.on('guildMemberAdd', async (guildMember) => {
  if (!mainChannel || guildMember.guild.id !== GMI_GUILD) return

  try {
    // Retrieve the user previous roles and display name
    if (await isCpbotOnline(guildMember.guild)) return

    const [userRoles, userDisplayName] = await Promise.all([
      retrieveMemberRoles(guildMember),
      UserModel.getName(guildMember.id)
    ])
    let embed: MessageEmbed

    if (!userRoles) {
      // If new user, welcome it for the first time
      embed = await getActionEmbed(guildMember.user, `Benvenutə ${guildMember.displayName} su GameMaker Italia!`)
    } else {
      // Otherwise, welcome it back on the server
      embed = await getActionEmbed(guildMember.user, `Bentornatə ${userDisplayName || guildMember.displayName} su GameMaker Italia!`)

      disabledNicknameUpdates[guildMember.id] = true
      setTimeout(() => delete disabledNicknameUpdates[guildMember.id], 5000)
      guildMember.roles.add(userRoles).catch((err: Error) => logger.error(err))
      guildMember.setNickname(userDisplayName).catch((err: Error) => logger.error(err))
    }

    await mainChannel.send(embed)
  } catch (err) {
    logger.error(err)
  }
})

/* Log people leaving the server */
bot.on('guildMemberRemove', async (guildMember) => {
  if (!mainChannel || guildMember.guild.id !== GMI_GUILD) return

  // Store the user roles
  storeMemberRoles(guildMember)

  try {
    if (await isCpbotOnline(guildMember.guild)) return

    const embed = await getActionEmbed(guildMember.user, `${guildMember.displayName} ha lasciato il server`)
    await mainChannel.send(embed)
  } catch (err) {
    logger.error(err)
  }
})

/* Log new banned people */
bot.on('guildBanAdd', async (guild, user) => {
  if (!mainChannel || guild.id !== GMI_GUILD) return

  try {
    if (await isCpbotOnline(guild)) return
    await mainChannel.send(`\`\`\`${user.username} è statə bannatə dal server\`\`\``)
  } catch (err) {
    logger.error(err)
  }
})

/* Log new unbanned people */
bot.on('guildBanRemove', async (guild, user) => {
  if (!mainChannel || guild.id !== GMI_GUILD) return

  try {
    if (await isCpbotOnline(guild)) return
    const embed = await getActionEmbed(user, `Il ban di ${user.username} è stato revocato`)
    await mainChannel.send(embed)
  } catch (err) {
    logger.error(err)
  }
})

// Store the updated users roles
bot.on('guildMemberUpdate', async (oldMember, newMember) => {
  if (newMember.guild?.id !== GMI_GUILD) return

  if (oldMember.roles.cache.size !== newMember.roles.cache.size) {
    storeMemberRoles(newMember)
  }

  // Log the nickname change
  try {
    if (oldMember.displayName !== newMember.displayName || oldMember.user.username !== newMember.user.username) {
      await UserModel.setName(newMember.id, newMember.displayName || newMember.user.username)
      if (await isCpbotOnline(newMember.guild) || disabledNicknameUpdates[newMember.id]) return

      const embed = await getActionEmbed(
        newMember.user,
        `${oldMember.displayName} ora si chiama ${newMember.displayName}`,
        `Username: @${newMember.user.username}`
      )
      await mainChannel.send(embed)
    }
  } catch (err) {
    logger.error(err)
  }
})

bot.on('messageReactionAdd', (messageReaction, user) => {
  if (messageReaction.message.guild?.id !== GMI_GUILD) return

  // Update the reactions stats
  incrReactCount(messageReaction.message.guild, messageReaction.emoji)

  // Increment the user most used emotes
  incrementMostUsedEmotes([messageReaction.emoji.toString()], messageReaction.message.guild, user.id)
})

bot.on('messageReactionRemove', (messageReaction, user) => {
  if (messageReaction.message.guild?.id !== GMI_GUILD) return

  /* Update the reactions stats */
  decrReactCount(messageReaction.message.guild, messageReaction.emoji)

  // Decrement the user most used emotes
  decrementMostUsedEmotes([messageReaction.emoji.toString()], messageReaction.message.guild, user.id)
})

// Connect to Discord
export const start = async () => {
  bot.login(BOT_TOKEN)
  await isReady
}
