// import { GuildChannel } from 'discord.js'
// import { Task } from '../../lib/Queue'
// import * as Discussion from '../../models/Discussion'

// export default {
//   cmd: 'channel topic',

//   handler: async ({ message, text, reply }: Task) => {
//     if (!message.guild) return reply(`Scusa ${message.author.username} ma questo comando non è disponibile qui.`)

//     const input = text.replace('channel topic', '')

//     if (!input) {
//       return reply('inserisci il nuovo topic del canale temporaneo')
//     }

//     // Get the user channel
//     const userId = message.author.id
//     const discussion = await Discussion.getByUser(userId)
//     if (!discussion) return reply('non hai creato un canale temporaneo')

//     const channel = message.guild.channels.cache.get(discussion.id) as GuildChannel
//     if (!channel) {
//       await Discussion.remove(userId)
//       return reply('il canale temporaneo è stato cancellato manualmente')
//     }

//     await channel.setTopic(input)
//     await reply('il topic del canale temporaneo è stato modificato')
//   }
// }
