import { Snowflake } from 'discord-api-types'
import { Guild, TextChannel, User } from 'discord.js'
import { bot } from '..'
import { GMI_GUILD } from '../../Config'
import { isCpbotOnline } from '../../IsCpbotOnline'
import logger from '../../Logger'
import { getActionEmbed } from '../../utils/getActionEmbed'

export const guildBanAdd = async ({ guild, user }: { guild: Guild, user: User }) => {
  const mainChannel = bot.channels.cache.get(GMI_GUILD as Snowflake) as TextChannel
  if (!mainChannel || guild.id !== GMI_GUILD) return

  try {
    if (await isCpbotOnline(guild)) return
    const embed = await getActionEmbed(user, `Il ban di ${user.username} è stato revocato`)
    await mainChannel.send({ embeds: [embed] })
  } catch (err) {
    logger.error(err)
  }
}
