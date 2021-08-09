import { GuildMember, MessageEmbed, Snowflake, TextChannel } from 'discord.js'
import pretty from 'pretty-time'
import { GMI_GUILD } from '../../Config'
import { isCpbotOnline } from '../../IsCpbotOnline'
import logger from '../../Logger'
import { retrieveMemberRoles } from '../../RoleStore'
import { getActionEmbed } from '../../utils/getActionEmbed'
import * as UserModel from '../../../models/User'
import { bot } from '..'

export const guildMemberAdd = async (guildMember: GuildMember) => {
  const mainChannel = bot.channels.cache.get(GMI_GUILD as Snowflake) as TextChannel
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

      guildMember.roles.add(userRoles).catch((err: Error) => logger.error(err))
      guildMember.setNickname(userDisplayName).catch((err: Error) => logger.error(err))
    }

    await mainChannel.send({ embeds: [embed] })
  } catch (err) {
    logger.error(err)
  }
}
