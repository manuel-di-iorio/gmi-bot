import { MessageEmbed } from 'discord.js'
import { GMI_DISCUSSION_CATEGORY_ID } from '../../lib/Config'
import { Task } from '../../lib/Queue'
import { getUserDisplayName } from '../../lib/utils/GetUserDisplayName'
import * as Discussion from '../../models/Discussion'

export default {
  cmd: 'channel',

  handler: async ({ message, reply, text }: Task) => {
    if (!message.guild) return reply(`Scusa ${message.author.username} ma questo comando non è disponibile qui.`)

    const input = text.replace('channel', '')

    if (!input) {
      // Send command help
      const embed = new MessageEmbed().setColor('#b959b6')
      if (message.guild) embed.setAuthor('Discussioni | GameMaker Italia', message.guild.iconURL())

      embed
        .setFooter(`!channel richiesto da ${getUserDisplayName(message)}`, message.author.displayAvatarURL())
        .setDescription('Crea un canale temporaneo per discussioni dedicate. Puoi creare max un canale alla volta. Il canale scade 6 ore dopo l\'ultimo messaggio')

        .addField('Comandi:', `\`!channel <nome>\` - Crea un canale temporaneo
\`!channel topic <topic>\` - Modifica il topic del canale
\`!channel rename <nome>\` - Rinomina il canale
\`!channel remove\` - Cancella il canale`, false)

      return message.channel.send(embed)
    }

    // Check if the user already created a channel
    const userId = message.author.id
    const hasChannel = await Discussion.getByUser(userId)
    if (hasChannel) return reply('hai già creato un canale temporaneo')

    // Create the channel
    const channel = await message.guild.channels.create(input, {
      topic: 'Canale temporaneo creato da ' + getUserDisplayName(message),
      parent: GMI_DISCUSSION_CATEGORY_ID
    })

    // Store the channel on Redis
    await Discussion.createOrExtend(userId, channel.id)

    await reply(`il canale temporaneo ${channel} è stato creato`)
  }
}
