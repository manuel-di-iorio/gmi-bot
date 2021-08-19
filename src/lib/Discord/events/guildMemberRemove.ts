import { Snowflake } from 'discord-api-types'
import { GuildMember, TextChannel, User } from 'discord.js'
import { bot } from '..'
import { GMI_GUILD } from '../../Config'
import { isCpbotOnline } from '../../IsCpbotOnline'
import logger from '../../Logger'
import { storeMemberRoles } from '../../RoleStore'
import { getActionEmbed } from '../../utils/getActionEmbed'
import * as UserModel from '../../../models/User'

export const guildMemberRemove = async (guildMember: GuildMember) => {
  const time = process.hrtime()
  const mainChannel = bot.channels.cache.get(GMI_GUILD as Snowflake) as TextChannel
  if (!mainChannel || guildMember.guild.id !== GMI_GUILD) return

  // Store the kick time
  UserModel.setKickTime(guildMember.id, JSON.stringify(time))
    .catch((err: Error) => logger.error(err))

  // Store the user roles
  storeMemberRoles(guildMember)

  try {
    if (await isCpbotOnline(guildMember.guild)) return

    // Get the kick executor and reason (if any)
    let kickMsg: string
    // const fetchedLogs = await guildMember.guild.fetchAuditLogs({
    //   limit: 1,
    //   type: 'MEMBER_KICK'
    // })

    // const fetchedLog = fetchedLogs.entries.first()
    // if (fetchedLog && (fetchedLog.target as User).id === guildMember.id) {
    //   const username = guildMember.guild.members.cache.get(fetchedLog.executor.id)?.displayName
    //   kickMsg = `Kickatə da ${username}`
    //   if (fetchedLog.reason) kickMsg += `: ${fetchedLog.reason}`
    // }

    const embed = await getActionEmbed(guildMember.user, `${guildMember.displayName} ha lasciato il server`, null, kickMsg)
    await mainChannel.send({ embeds: [embed] })
  } catch (err) {
    logger.error(err)
  }
}
