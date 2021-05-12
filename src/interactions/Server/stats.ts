import moment from 'moment'
import prettyDate from 'pretty-date'
import { ApplicationCommandOptionType } from 'discord-api-types'
import { CommandInteraction, MessageEmbed } from 'discord.js'
import { redis } from '../../lib/Redis'
import { getAvatarTopColor } from '../../lib/utils/getAvatarTopColor'
import { provincesToRegion } from '../../lib/utils/ProvincesList'
import { translateTimeToItalian } from '../../lib/utils/translateTimeToItalian'
import { getUserDisplayNameForInteraction } from '../../lib/utils/GetUserDisplayNameForInteraction'

interface UserModel {
  'msg'?: number;
  'latest-msg-date'?: string;
  'most-mentioned-user'?: string;
  'most-used-emote'?: string;
  'city'?: string;
  'bday'?: string;
}

export const statsInteraction = {
  version: 0,
  oldVersion: 0,

  interaction: {
    name: 'stats',
    description: 'Mostra il profilo di un utente',
    options: [{
      name: 'user',
      type: ApplicationCommandOptionType.USER,
      description: 'Utente di cui mostrare il profilo'
    }]
  },

  handler: async (message: CommandInteraction) => {
    // Get the user to show
    const user = !message.options.length ? message.user : message.options[0].user

    const userId = user.id
    const userKey = `u:${userId}`
    let region: string

    const [userRedisData, avatarColor, city] = await Promise.all([
      redis.hgetall(userKey),
      getAvatarTopColor(user),
      redis.hget(`${userKey}:info`, 'city')
    ])

    let userData = userRedisData as unknown as UserModel
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
      userData.bday = `**${userBdayMoment.format('DD MMMM YYYY')}** (${userBdayYears} anni)`
    }
    if (!userData['latest-msg-date']) {
      userData['latest-msg-date'] = 'N/A'
    } else {
      userData['latest-msg-date'] = moment(new Date(parseInt(userData['latest-msg-date']))).format('HH:mm:ss DD/MM/YYYY')
    }

    // Get the region from the user city
    if (city) region = provincesToRegion[city]

    // Get the server join pretty date
    // @ts-expect-error
    const serverJoinPrettyDate = message.member ? translateTimeToItalian(prettyDate.format(message.member.joinedAt)) : 'N/A'

    // Get the discord signup pretty date
    const discordSignupPrettyDate = translateTimeToItalian(prettyDate.format(user.createdAt))

    // Send the message
    const embed = new MessageEmbed()
      .setColor(avatarColor)
      .setThumbnail(user.avatarURL())
      .setTitle(getUserDisplayNameForInteraction(message, userId).toUpperCase())

      .setDescription(`Emote più usata: **${userData['most-used-emote']}** (x${userData['most-used-emote-count']})
Utente più menzionato: **${userData['most-mentioned-user']}** (x${userData['most-mentioned-user-count']})
Città: ${city || 'N/A'}${region ? `, ${region}` : ''}
Compleanno: ${userData.bday}
Ultimo messaggio: **${userData['latest-msg-date']}**
Messaggi inviati: **${userData.msg}**
Entrato su GMI: **${serverJoinPrettyDate}**
Iscritto a Discord: **${discordSignupPrettyDate}**`)

    await message.reply(embed)
  }
}
