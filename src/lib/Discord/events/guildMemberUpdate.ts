import { Snowflake } from 'discord-api-types'
import { GuildMember, TextChannel, User } from 'discord.js'
import { bot } from '..'
import { GMI_GUILD } from '../../Config'
import { isCpbotOnline } from '../../IsCpbotOnline'
import logger from '../../Logger'
import { storeMemberRoles } from '../../RoleStore'
import { getActionEmbed } from '../../utils/getActionEmbed'
import * as UserModel from '../../../models/User'

export const guildMemberUpdate = async (oldMember: GuildMember, newMember: GuildMember) => {
  if (newMember.guild?.id !== GMI_GUILD) return
  const mainChannel = bot.channels.cache.get(GMI_GUILD as Snowflake) as TextChannel

  if (oldMember.roles.cache.size !== newMember.roles.cache.size) {
    storeMemberRoles(newMember)
  }

  // Log the nickname change
  try {
    if (oldMember.displayName !== newMember.displayName || oldMember.user.username !== newMember.user.username) {
      await UserModel.setName(newMember.id, newMember.displayName || newMember.user.username)

      if (await isCpbotOnline(newMember.guild)) return

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
}
