import { Task } from '../../lib/Queue'
import { redis } from '../../lib/Redis'
import { MessageEmbed } from 'discord.js'
import { getUserDisplayName } from '../../lib/utils/GetUserDisplayName'
import logger from '../../lib/Logger'

interface UserModel {
  'msg'?: number;
  'indiexpo-gems'?: number;
  'indiexpo-gems-total'?: number;
}

export default {
  resolver: (text: string) => text.startsWith('stats'),

  handler: async ({ message }: Task) => {
    // Get the user to show
    console.log(message.mentions.users.array())
    const user = message.mentions.users.size ? message.mentions.users.first() : message.author
    const userId = user.id
    const userKey = `u:${userId}`

    let userData = await redis.hgetall(userKey) as unknown as UserModel
    if (!userData) userData = {}
    if (!userData.msg) userData.msg = 0
    if (!userData['indiexpo-gems']) userData['indiexpo-gems'] = 0
    if (!userData['indiexpo-gems-total']) userData['indiexpo-gems-total'] = 0

    // Send the message
    const embed = new MessageEmbed()
      .setThumbnail(user.avatarURL())
      .setTitle(getUserDisplayName(message, userId).toUpperCase())
      .setFooter('!stats richiesto da ' + getUserDisplayName(message), message.author.avatarURL())

      .setDescription(`Gemme di questo mese: **${userData['indiexpo-gems']}**
Gemme totali: **${userData['indiexpo-gems-total']}**
Messaggi registrati: **${userData.msg}**`)

    message.delete().catch((err: Error) => logger.error(err))
    await message.channel.send(embed)
  }
}
