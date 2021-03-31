import { MessageEmbed } from 'discord.js'
import { Task } from '../../lib/Queue'
import { getUserDisplayName } from '../../lib/utils/GetUserDisplayName'

export default {
  cmd: 'channel',

  handler: async ({ message, reply }: Task) => {
    if (!message.guild) return reply(`Scusa ${message.author.username} ma questo comando non è disponibile qui.`)

    // Send command help
    const embed = new MessageEmbed().setColor('#b959b6')
    if (message.guild) embed.setAuthor('Discussioni | GameMaker Italia', message.guild.iconURL())

    embed
      .setFooter(`!channel richiesto da ${getUserDisplayName(message)}`, message.author.displayAvatarURL())
      .setDescription('Crea un canale temporaneo per discussioni dedicate. Puoi creare max un canale alla volta. Il canale scade 6 ore dopo l\'ultimo messaggio')

      .addField('Comandi:', `\`#nome-canale#\` - Crea un canale temporaneo
\`!channel topic <topic>\` - Modifica il topic del canale
\`!channel rename <nome>\` - Rinomina il canale
\`!channel remove\` - Cancella il canale`, false)

    return message.channel.send(embed)
  }
}
