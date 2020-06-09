import { Client, TextChannel, Message } from 'discord.js'
import { BOT_TOKEN, GMI_GUILD, NODE_ENV } from './Config'
import logger from './Logger'
import { onMessage, onMessageOps } from './OnMessage'
import { isCpbotOnline } from './IsCpbotOnline'
import { storeMemberRoles, retrieveMemberRoles } from './RoleStore'
import { incrReactCount, decrReactCount } from './EmoteStore'
import { getWelcomeImage } from './utils/GetWelcomeImage'
import { incrementUserGems, decrementUserGems } from './AssignIndiexpoGems'
import { incrementMostUsedEmotes, decrementMostUsedEmotes } from './UserStats'

export const bot = new Client()
let mainChannel: TextChannel

bot.on('ready', () => {
  logger.info('[BOT] Ready')

  // Get the main channel
  mainChannel = bot.channels.cache.get(GMI_GUILD) as TextChannel

  // Send a start message in dev
  NODE_ENV === 'development' && mainChannel.send('Connected').catch((err: Error) => logger.error(err))

  // Set the bot activity
  bot.user.setActivity('!help').catch((err: Error) => logger.err(err))
  setInterval(() => bot.user.setActivity('!help').catch((err: Error) => logger.err(err)), 1000 * 60 * 60)
})

bot.on('error', (err: Error) => {
  logger.error('[DISCORD] Generic error', err)
})

bot.on('message', (message: Message) => {
  if (message.author.bot) return
  const content = message.content.trim()
  onMessage(message, content)
  onMessageOps(message, content)
})

/* Say hello to new members */
bot.on('guildMemberAdd', async (guildMember) => {
  if (!mainChannel || guildMember.guild.id !== GMI_GUILD) return

  try {
    // Retrieve the user previous roles
    if (await isCpbotOnline(guildMember.guild)) return

    const userRoles = await retrieveMemberRoles(guildMember)

    if (!userRoles) {
      // If new user, welcome it for the first time
      const attachment = await getWelcomeImage(guildMember)
      await mainChannel.send(`Benvenuto/a ${guildMember} su GameMaker Italia!`, attachment)
    } else {
      // Otherwise, welcome it back on the server
      await Promise.all([
        guildMember.roles.add(userRoles),
        mainChannel.send(`\`\`\`Bentornato/a ${guildMember.displayName} su GameMaker Italia!\`\`\``)
      ])
    }
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
    await mainChannel.send(`\`\`\`${guildMember.displayName} ha lasciato il server\`\`\``)
  } catch (err) {
    logger.error(err)
  }
})

/* Log new banned people */
bot.on('guildBanAdd', async (guild, user) => {
  if (!mainChannel || guild.id !== GMI_GUILD) return

  try {
    if (await isCpbotOnline(guild)) return
    await mainChannel.send(`\`\`\`${user.username} è stato/a bannato/a dal server\`\`\``)
  } catch (err) {
    logger.error(err)
  }
})

/* Log new unbanned people */
bot.on('guildBanRemove', async (guild, user) => {
  if (!mainChannel || guild.id !== GMI_GUILD) return

  try {
    if (await isCpbotOnline(guild)) return
    mainChannel.send(`\`\`\`${user.username} è stato/a sbannato/a dal server\`\`\``)
  } catch (err) {
    logger.error(err)
  }
})

// Store the updated users roles
bot.on('guildMemberUpdate', (oldMember, newMember) => {
  if (newMember.guild?.id !== GMI_GUILD) return

  if (oldMember.roles.cache.size !== newMember.roles.cache.size) {
    storeMemberRoles(newMember)
  }
})

bot.on('messageReactionAdd', (messageReaction, user) => {
  if (messageReaction.message.guild?.id !== GMI_GUILD) return

  // Update the reactions stats
  incrReactCount(messageReaction.message.guild, messageReaction.emoji)

  // Increment the user gems
  if (messageReaction.emoji.name === 'baron') incrementUserGems(user.id)

  // Increment the user most used emotes
  incrementMostUsedEmotes([messageReaction.emoji.toString()], messageReaction.message.guild, user.id)
})

bot.on('messageReactionRemove', (messageReaction, user) => {
  if (messageReaction.message.guild?.id !== GMI_GUILD) return

  /* Update the reactions stats */
  decrReactCount(messageReaction.message.guild, messageReaction.emoji)

  // Decrement the user gems
  if (messageReaction.emoji.name === 'baron') decrementUserGems(user.id)

  // Decrement the user most used emotes
  decrementMostUsedEmotes([messageReaction.emoji.toString()], messageReaction.message.guild, user.id)
})

// Connect to Discord
export const start = () => bot.login(BOT_TOKEN)
