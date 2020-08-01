import { Guild } from 'discord.js'
import { redis } from './Redis'
import { bot } from './Discord'
import { GMI_GUILD } from './Config'

const CPBOT_ID = '518892855968923648'

/** Check if Cpbot is online */
export const isCpbotOnline = async (guild: Guild): Promise<boolean> => {
  const members = await guild.members.fetch()
  const cpbot = members.get(CPBOT_ID)
  return !!cpbot && cpbot.presence.status !== 'offline'
}

/** Process the CPBot uptime */
export const processCpbotUptime = async (): Promise<void> => {
  const gmiGuild = bot.guilds.cache.get(GMI_GUILD)
  if (await isCpbotOnline(gmiGuild)) {
    await redis.hincrby('cpbot', 'uptime-success', 1)
  } else {
    await redis.hincrby('cpbot', 'uptime-failed', 1)
  }
}

export const resetCpbotUptime = async () => {
  await redis.hmset('cpbot', 'uptime-success', 0, 'uptime-failed', 0)
}
