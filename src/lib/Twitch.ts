import axios, { AxiosRequestConfig } from 'axios'
import { MessageEmbed, TextChannel } from 'discord.js'
import {
  GMI_GUILD, TWITCH_API_HOST, TWITCH_API_LOGIN_HOST, TWITCH_CLIENT_ID, TWITCH_SECRET, TWITCH_USER_ID
} from './Config'
import { bot } from './Discord'
import logger from './Logger'

let headers: AxiosRequestConfig
const liveCheckTimeout = 1000 * 60
const refreshAccessTokenTimeout = 1000 * 60 * 3
const canCheckLiveTimeout = 1000 * 60 * 10
let canCheckLive = true
let latestLiveTitle: string

/**
 * Get the new access token
 */
const getAccessToken = async () => {
  try {
    const { data: { access_token: accessToken } } = await axios.post(`${TWITCH_API_LOGIN_HOST}/oauth2/token?client_id=${TWITCH_CLIENT_ID}&client_secret=${TWITCH_SECRET}&grant_type=client_credentials`)
    headers = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Client-Id': TWITCH_CLIENT_ID
      }
    } as AxiosRequestConfig
  } catch (err) {
    logger.error(err)
    headers = null
    setTimeout(getAccessToken, refreshAccessTokenTimeout)
  }
}

/**
 * Check if the channel is live
 */
const checkIsLive = async () => {
  const mainChannel = bot.channels.cache.get(GMI_GUILD) as TextChannel

  if (headers && mainChannel && canCheckLive) {
    let streams = []

    try {
      ({ data: { data: streams } } = await axios(`${TWITCH_API_HOST}/streams?user_id=${TWITCH_USER_ID}`, headers))
    } catch (err) {
      // Refresh the token when expired
      if (err.response.status === 401) {
        await getAccessToken()
        logger.debug('[TWITCH] Refreshing access token..')
      } else {
        console.error(err)
      }
    }

    if (streams.length) {
      const [stream] = streams
      if (stream.type === 'live' && stream.title !== latestLiveTitle) {
        // Temporarily disable the live check
        latestLiveTitle = stream.title
        canCheckLive = false
        setTimeout(() => { canCheckLive = true }, canCheckLiveTimeout)

        try {
          // Get the channel icon
          const { data: { data: usersData } } = await axios(`${TWITCH_API_HOST}/users?id=${TWITCH_USER_ID}`, headers)
          const [userData] = usersData
          const channelIcon = userData.profile_image_url

          // Send the bot notification of the live stream
          const embed = new MessageEmbed()
          embed.setColor('#6441a5')
          embed.setTitle(`LIVE ORA: ${stream.title.toUpperCase()}`)
          embed.setThumbnail(channelIcon)
          embed.setDescription('https://www.twitch.tv/gamemakeritalia')
          embed.setURL('https://www.twitch.tv/gamemakeritalia')
          embed.setFooter(`GameMakerItalia sta streammando ${stream.game_name}`)
          embed.setImage(stream.thumbnail_url.replace('{width}', 320).replace('{height}', 240))

          await mainChannel.send(embed)
        } catch (err) {
          logger.error(err)
        }
      }
    }
  }

  setTimeout(checkIsLive, liveCheckTimeout)
}

export const start = async () => {
  await getAccessToken()
  await checkIsLive()
  logger.info('[TWITCH] Ready')
}
