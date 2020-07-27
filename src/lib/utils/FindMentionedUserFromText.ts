import { User, GuildMember, Collection } from 'discord.js'
import natural from 'natural'

const { JaroWinklerDistance } = natural

/**
 * Find the mentioned users from a plain text
 */
export const findMentionedUsersFromPlainText = (text: string, members: Collection<string, GuildMember>): User[] => {
  // Get the plain text user names
  const plainUsers = text.replace(/<@!\d+>/g, '').trim().toLowerCase().split(' ')

  const list: User[] = []
  members.each((member) => {
    const found = plainUsers.find(plainUser => JaroWinklerDistance(plainUser, member.displayName.toLowerCase()) > 0.9)
    if (found) list.push(member.user)
  })
  return list
}
