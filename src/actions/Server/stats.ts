import moment from 'moment'
import { Task } from '../../lib/Queue'
import { redis } from '../../lib/Redis'
import { MessageEmbed } from 'discord.js'
import { getUserDisplayName } from '../../lib/utils/GetUserDisplayName'
import { findMentionedUsersFromPlainText } from '../../lib/utils/FindMentionedUserFromText'
import { getAvgColorFromImg } from '../../lib/utils/GetAvgColorFromImg'

interface UserModel {
  'msg'?: number;
  'latest-msg-date'?: string;
  'most-mentioned-user'?: string;
  'most-used-emote'?: string;
  'bday'?: string;
}

export default {
  cmd: 'stat',

  handler: async ({ message, text }: Task) => {
    // Get the user to show
    let user = message.mentions.users.size && message.mentions.users.first()
    if (message.guild && !user) {
      user = findMentionedUsersFromPlainText(text.replace('stats', ''), message.guild.members.cache).shift()
    }
    if (!user) user = message.author

    const userId = user.id
    const userKey = `u:${userId}`

    let userData = await redis.hgetall(userKey) as unknown as UserModel
    if (!userData) userData = {}
    if (!userData.msg) userData.msg = 0
    if (!userData['most-used-emote']) userData['most-used-emote'] = 'N/A'
    if (!userData['most-used-emote-count']) userData['most-used-emote-count'] = 0
    if (!userData['most-mentioned-user']) userData['most-mentioned-user'] = 'N/A'
    if (!userData['most-mentioned-user-count']) userData['most-mentioned-user-count'] = 0
    if (!userData.bday) {
      userData.bday = 'N/A'
    } else {
      const userBdayMoment = moment(userData.bday, 'DD/MM/YYYY')
      const currentYear = new Date().getFullYear()
      const userBdayYears = currentYear - parseInt(userBdayMoment.format('YYYY'))
      userData.bday = `${userBdayMoment.format('DD MMMM YYYY')} (${userBdayYears} anni)`
    }
    if (!userData['latest-msg-date']) {
      userData['latest-msg-date'] = 'N/A'
    } else {
      userData['latest-msg-date'] = moment(new Date(parseInt(userData['latest-msg-date']))).format('HH:mm:ss DD/MM/YYYY')
    }

    const avatarUrl = user.avatarURL({ format: 'png', size: 64 })
    const avatarColor = await getAvgColorFromImg(avatarUrl)

    // Send the message
    const embed = new MessageEmbed()
      .setColor(avatarColor)
      .setThumbnail(user.avatarURL())
      .setTitle(getUserDisplayName(message, userId).toUpperCase())
      .setFooter('!stats richiesto da ' + getUserDisplayName(message), message.author.avatarURL())

      .setDescription(`Emote più usata: **${userData['most-used-emote']}** (x${userData['most-used-emote-count']})
Utente più menzionato: **${userData['most-mentioned-user']}** (x${userData['most-mentioned-user-count']})
Compleanno: **${userData.bday}**
Ultimo messaggio: **${userData['latest-msg-date']}**
Messaggi registrati: **${userData.msg}**`)

    await message.channel.send(embed)
  }
}
