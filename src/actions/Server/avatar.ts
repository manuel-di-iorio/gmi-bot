import { Task } from '../../lib/Queue'
import { findMentionedUsersFromPlainText } from '../../lib/utils/FindMentionedUserFromText'

export default {
  cmd: 'avatar',

  handler: async ({ message, text }: Task) => {
    // Get the user which to show the avatar
    let user = message.mentions.users.first()
    if (message.guild && !user) {
      user = findMentionedUsersFromPlainText(text.replace('avatar', ''), message.guild.members.cache).shift()
    }
    if (!user) user = message.author

    // Send the avatar
    await message.channel.send(user.displayAvatarURL({ format: 'png', size: 512 }))
  }
}
