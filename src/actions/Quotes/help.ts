import { Task } from '../../lib/Queue'
import { MessageEmbed } from 'discord.js'
import { getUserDisplayName } from '../../lib/utils/GetUserDisplayName'

export default {
  resolver: (text: string) => text.startsWith('quotes'),

  handler: async ({ message }: Task) => {
    const embed = new MessageEmbed().setColor('#a5c0d6')
    if (message.guild) embed.setAuthor('Quotes | GameMaker Italia', message.guild.iconURL())

    embed
      .setDescription('⚠️ __Non mettere `<>` o `[]` intorno ai parametri.__')
      .setFooter(`!quotes richiesto da ${getUserDisplayName(message)}`, message.author.displayAvatarURL())

    embed.addField('Comandi:', `\`!set <name> | <value>\` - Per salvare una citazione
      \`,<name>\` - Mostra il testo di una citazione
      \`!unset <name>\` - Cancella una citazione salvata
      \`!quotes list\` - Mostra le citazioni salvate`, false)

    embed.addField('Esempio:', `\`!quotes set hello | world\` - Salva la citazione con il nome 'hello'
\`,hello\` - Mostra il valore associato (ad es. 'world')`, false)

    await message.channel.send(embed)
  }
}
