import moment from 'moment'
import { Task } from '../../lib/Queue'
import { redis } from '../../lib/Redis'
import { MessageEmbed } from 'discord.js'
import { getUserDisplayName } from '../../lib/utils/GetUserDisplayName'
import logger from '../../lib/Logger'

interface UserModel {
  'msg'?: number;
  'indiexpo-gems'?: number;
  'indiexpo-gems-total'?: number;
  'latest-msg-date'?: string;
  'most-mentioned-user'?: string;
  'most-used-emote'?: string;
}

export default {
  resolver: (text: string) => text.startsWith('stats'),

  handler: async ({ message }: Task) => {
    // Get the user to show
    const user = message.mentions.users.size ? message.mentions.users.first() : message.author
    const userId = user.id
    const userKey = `u:${userId}`

    let userData = await redis.hgetall(userKey) as unknown as UserModel
    if (!userData) userData = {}
    if (!userData.msg) userData.msg = 0
    if (!userData['indiexpo-gems']) userData['indiexpo-gems'] = 0
    if (!userData['indiexpo-gems-total']) userData['indiexpo-gems-total'] = 0
    if (!userData['most-used-emote']) userData['most-used-emote'] = 'N/A'
    if (!userData['most-used-emote-count']) userData['most-used-emote-count'] = 0
    if (!userData['most-mentioned-user']) userData['most-mentioned-user'] = 'N/A'
    if (!userData['most-mentioned-user-count']) userData['most-mentioned-user-count'] = 0
    if (!userData['latest-msg-date']) {
      userData['latest-msg-date'] = 'N/A'
    } else {
      userData['latest-msg-date'] = moment(new Date(parseInt(userData['latest-msg-date']))).format('HH:mm:ss DD/MM/YYYY')
    }

    // Send the message
    const embed = new MessageEmbed()
      .setThumbnail(user.avatarURL())
      .setTitle(getUserDisplayName(message, userId).toUpperCase())
      .setFooter('!stats richiesto da ' + getUserDisplayName(message), message.author.avatarURL())

      .setDescription(`Gemme attuali: **${userData['indiexpo-gems']}**
Gemme guadagnate in totale: **${userData['indiexpo-gems-total']}**
Emote più usata: **${userData['most-used-emote']}** (x${userData['most-used-emote-count']})
Utente più menzionato: **${userData['most-mentioned-user']}** (x${userData['most-mentioned-user-count']})
Ultimo messaggio: **${userData['latest-msg-date']}**
Messaggi registrati: **${userData.msg}**`)

    message.delete().catch((err: Error) => logger.error(err))
    await message.channel.send(embed)
  }
}