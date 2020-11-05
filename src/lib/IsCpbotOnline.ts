import { Guild } from 'discord.js'

const CPBOT_ID = '518892855968923648'

/** Check if Cpbot is online */
export const isCpbotOnline = async (guild: Guild): Promise<boolean> => {
  try {
    const cpbot = await guild.members.fetch(CPBOT_ID)
    return !!cpbot && cpbot.presence.status !== 'offline'
  } catch (err) {
    if (err.code === 10007) return false // UnknownMember
    throw err
  }
}
