import { GuildMember, PartialGuildMember, Role, Collection, RoleResolvable, Snowflake } from 'discord.js'
import { redis } from './Redis'
import logger from './Logger'

/** Store the member roles on roles update/server leaving */
export const storeMemberRoles = async (guildMember: GuildMember | PartialGuildMember) => {
  if (!guildMember.manageable) return

  const roles = guildMember.roles.cache
    .filter(role => role.name !== '@everyone')
    .map(role => role.id)
    .join(',')

  if (roles) {
    try {
      await redis.hset(`u:${guildMember.user.id}`, 'roles', roles)
    } catch (err) {
      logger.error(err)
    }
  }
}

/** Retrieve the member roles when joining the server */
export const retrieveMemberRoles = async (guildMember: GuildMember | PartialGuildMember): Promise<RoleResolvable[] | null> => {
  if (!guildMember.manageable) return

  try {
    const roles = await redis.hget(`u:${guildMember.user.id}`, 'roles')
    if (roles) {
      return roles.split(',') as RoleResolvable[]
    }
  } catch (err) {
    logger.error(err)
  }
}

export const addUserRoles = async (
  guildMember: GuildMember,
  newRoles: string | Role | Collection<string, Role> | RoleResolvable[]
) => {
  await guildMember.roles.add(newRoles as Snowflake | Snowflake[])

  // Update the user roles on Redis
  const userRedisKey = `u:${guildMember.user.id}`
  const allRoles = guildMember.roles.cache.map(role => role.id).join(',')
  await redis.hset(userRedisKey, 'roles', allRoles)
}
