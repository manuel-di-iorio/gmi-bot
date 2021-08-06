import { Client, TextChannel, Message, MessageEmbed, Intents, Snowflake } from 'discord.js'
import pretty from 'pretty-time'
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
import { syncInteractionCommands } from '../interactions/syncInteractions'
import { interactions } from '../interactions'

let mainChannel: TextChannel
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

/** Map of temporary disabled nickname change updates */
const disabledNicknameUpdates = {}

const isReady = new Promise<void>(resolve => {
  bot.on('ready', () => {
    logger.info('[BOT] Ready')
    resolve()

    // Get the main channel
    mainChannel = bot.channels.cache.get(GMI_GUILD as Snowflake) as TextChannel

    // Send a start message in dev
    NODE_ENV === 'development' && mainChannel.send('Connected').catch((err: Error) => logger.error(err))

    // Save a redis key for backup-control purposes
    redis.set('backup-control', '1').catch((err: Error) => logger.error(err))

    // Sync the interaction commands
    syncInteractionCommands(mainChannel)
  })
})

bot.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return
  const { commandName } = interaction

  try {
    const startTime = process.hrtime()
    await interactions[commandName].handler(interaction)
    const endTime = process.hrtime(startTime)
    const execTime = ~~(endTime[0] * 1000 + (endTime[1] / 1e6)) + 'ms'
    logger.trace(`[QUEUE] Interaction task '${commandName}' executed in ${execTime}`)
  } catch (err) {
    logger.error(err)

    const reply = !interaction.deferred ? interaction.reply.bind(interaction) : interaction.editReply.bind(interaction)
    reply('È avvenuto un errore mentre eseguivo la richiesta')
      .catch((err: Error) => logger.error(err))
  }
})

// bot.on('debug', console.debug)

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
bot.on('guildMemberAdd', async (guildMember) => {
  if (!mainChannel || guildMember.guild.id !== GMI_GUILD) return

  try {
    // Retrieve the user previous roles and display name
    if (await isCpbotOnline(guildMember.guild)) return

    const [userRoles, userDisplayName, userKickTime] = await Promise.all([
      retrieveMemberRoles(guildMember),
      UserModel.getName(guildMember.id),
      UserModel.getKickTime(guildMember.id)
    ])

    /** Get the kick time duration */
    let kickDuration: string
    if (userKickTime) {
      const kickTime = JSON.parse(userKickTime)
      const kickedUserEndTime = process.hrtime(kickTime)
      const kickedUserEndTimeSecs = (kickedUserEndTime[0] + kickedUserEndTime[1] / Math.pow(10, 9))

      if (kickedUserEndTimeSecs < 10) {
        kickDuration = pretty(kickedUserEndTime, 'micro')
      } else if (kickedUserEndTimeSecs < 60) {
        kickDuration = pretty(kickedUserEndTime, 'ms')
      } else if (kickedUserEndTimeSecs < 3600) {
        kickDuration = pretty(kickedUserEndTime, 's')
      } else if (kickedUserEndTimeSecs < 86400) {
        kickDuration = pretty(kickedUserEndTime, 'm')
      } else {
        kickDuration = pretty(kickedUserEndTime, 'd')
      }
    }

    // Remove the stored kick time
    UserModel.unsetKickTime(guildMember.id)
      .catch((err: Error) => logger.error(err))

    let embed: MessageEmbed

    if (!userRoles) {
      // If new user, welcome it for the first time
      embed = await getActionEmbed(guildMember.user, `Benvenutə ${guildMember.displayName} su GameMaker Italia!`)
    } else {
      // Otherwise, welcome it back on the server
      const kickTimeDescription = kickDuration ? `Sei statə via ${kickDuration}` : null

      /** Send the embed */
      embed = await getActionEmbed(guildMember.user, `Bentornatə ${userDisplayName || guildMember.displayName} su GameMaker Italia!`, null, kickTimeDescription)

      disabledNicknameUpdates[guildMember.id] = true
      setTimeout(() => delete disabledNicknameUpdates[guildMember.id], 5000)
      guildMember.roles.add(userRoles).catch((err: Error) => logger.error(err))
      guildMember.setNickname(userDisplayName).catch((err: Error) => logger.error(err))
    }

    await mainChannel.send({ embeds: [embed] })
  } catch (err) {
    logger.error(err)
  }
})

/* Log people leaving the server */
bot.on('guildMemberRemove', async (guildMember) => {
  if (!mainChannel || guildMember.guild.id !== GMI_GUILD) return

  // Store the kick time
  UserModel.setKickTime(guildMember.id, JSON.stringify(process.hrtime()))
    .catch((err: Error) => logger.error(err))

  // Store the user roles
  storeMemberRoles(guildMember)

  try {
    if (await isCpbotOnline(guildMember.guild)) return

    const embed = await getActionEmbed(guildMember.user, `${guildMember.displayName} ha lasciato il server`)
    await mainChannel.send({ embeds: [embed] })
  } catch (err) {
    logger.error(err)
  }
})

/* Log new banned people */
bot.on('guildBanAdd', async ({ guild, user }) => {
  if (!mainChannel || guild.id !== GMI_GUILD) return

  try {
    if (await isCpbotOnline(guild)) return
    await mainChannel.send(`\`\`\`${user.username} è statə bannatə dal server\`\`\``)
  } catch (err) {
    logger.error(err)
  }
})

/* Log new unbanned people */
bot.on('guildBanRemove', async ({ guild, user }) => {
  if (!mainChannel || guild.id !== GMI_GUILD) return

  try {
    if (await isCpbotOnline(guild)) return
    const embed = await getActionEmbed(user, `Il ban di ${user.username} è stato revocato`)
    await mainChannel.send({ embeds: [embed] })
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
      await mainChannel.send({ embeds: [embed] })
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
  await bot.login(BOT_TOKEN)
  await isReady
}
