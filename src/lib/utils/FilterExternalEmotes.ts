import { Guild, Snowflake } from 'discord.js'

/** Filter external guild emotes */
export const filterExternalEmotes = (emotes: string[], guild: Guild) => {
  return emotes.filter(emote => {
    let emoteId = emote.split(':')[2]
    if (!emoteId) return false
    emoteId = emoteId.substr(0, emoteId.length - 1)
    return guild.emojis.cache.has(emoteId as Snowflake)
  })
}
