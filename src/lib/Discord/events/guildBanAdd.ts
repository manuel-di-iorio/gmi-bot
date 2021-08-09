import { Snowflake } from 'discord-api-types'
import { Guild, TextChannel, User } from 'discord.js'
import { bot } from '..'
import { GMI_GUILD } from '../../Config'
import { isCpbotOnline } from '../../IsCpbotOnline'
import logger from '../../Logger'
import { NEWLINE } from '../../utils/GetNewline'

export const guildBanAdd = async ({ guild, user }: { guild: Guild, user: User }) => {
  const mainChannel = bot.channels.cache.get(GMI_GUILD as Snowflake) as TextChannel
  if (!mainChannel || guild.id !== GMI_GUILD) return

  try {
    if (await isCpbotOnline(guild)) return

    let banMsg = `\`\`\`${user.username} è statə bannatə dal server`

    // Find the ban executor
    const fetchedLogs = await guild.fetchAuditLogs({
      limit: 1,
      type: 'MEMBER_BAN_ADD'
    })

    const fetchedLog = fetchedLogs.entries.first()
    if (fetchedLog && (fetchedLog.target as User).id === user.id) {
      const username = guild.members.cache.get(fetchedLog.executor.id)?.displayName
      banMsg += ` da ${username}`
      if (fetchedLog.reason) banMsg += `${NEWLINE}Motivo: ${fetchedLog.reason.replace('`', '')}`
      banMsg += '```'
    }

    await mainChannel.send(banMsg)
  } catch (err) {
    logger.error(err)
  }
}
