import { Message } from 'discord.js'
import logger from './Logger'
import { GMI_MEMBER_ROLE } from './Config'
import { redis } from './Redis'
import { addUserRoles } from './RoleStore'
import { isCpbotOnline } from './IsCpbotOnline'
import { getActionEmbed } from './utils/getActionEmbed'

export const assignGmiRoleToNewActiveUsers = async (message: Message) => {
  const { author, guild, channel } = message

  // Skip the check if the user already has the GMI role
  const guildMember = guild.members.cache.get(author.id)
  if (guildMember.roles.cache.has(GMI_MEMBER_ROLE)) return

  try {
    // Skip if Cpbot is online
    if (await isCpbotOnline(guildMember.guild)) return

    // Get the user cached messages count
    const userRedisKey = `u:${author.id}`
    const userMessages = parseInt(await redis.hget(userRedisKey, 'msg'))

    const timeDiff = Date.now() - guildMember.joinedTimestamp
    if (timeDiff > 6048e5 /* One week */ && userMessages > 99) {
      // Update the user role
      await addUserRoles(guildMember, [GMI_MEMBER_ROLE])

      const embed = await getActionEmbed(
        guildMember.user,
        `${guildMember.displayName} è attivo da almeno una settimana e ha raggiunto 100 messaggi, guadagnando così il ruolo GMI!`
      )
      await channel.send(embed)
    }
  } catch (err) {
    logger.error(err)
  }
}
