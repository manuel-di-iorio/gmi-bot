import { Collection, GuildChannel, CategoryChannel, TextChannel, Snowflake } from 'discord.js'
import { GMI_ARCHIVED_DISCUSSION_CH_ID, GMI_DISCUSSION_CATEGORY_ID } from '../../lib/Config'
import { bot } from '../../lib/Discord'
import { buildLogAttachment } from '../../lib/MessageStore'
import { Task } from '../../lib/Queue'
import * as Discussion from '../../models/Discussion'

export default {
  cmd: 'channel remove',

  handler: async ({ message, reply }: Task) => {
    if (!message.guild) return reply(`Scusa ${message.author.username} ma questo comando non è disponibile qui.`)

    // Get the user channel
    const userId = message.author.id
    const discussion = await Discussion.getByUser(userId)
    if (!discussion) return reply('non hai creato un canale temporaneo')

    const channelId = discussion.id
    const channel = message.guild.channels.cache.get(channelId)

    const archivedDiscussionCh = bot.channels.cache.get(GMI_ARCHIVED_DISCUSSION_CH_ID as Snowflake) as TextChannel
    const log = channel && await buildLogAttachment(channelId, channel.name + '.txt')

    // Remove the channel
    await Promise.all([
      log && archivedDiscussionCh.send(log.attachment),
      Discussion.remove(userId),
      channel && channel.delete()
    ])

    // Move the Discussions category on bottom, when there are no more channels in it
    const discussionChannel = bot.channels.cache.get(GMI_DISCUSSION_CATEGORY_ID as Snowflake) as CategoryChannel

    if (!discussionChannel.children.size) {
      const latestCategoryPos = (bot.channels.cache as Collection<string, GuildChannel>).reduce((pos, category) =>
        Math.max(pos, category.type === 'category' && category.position), 0)
      await discussionChannel.setPosition(latestCategoryPos)
    }

    await reply('il canale temporaneo è stato cancellato')
  }
}
