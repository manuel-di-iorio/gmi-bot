import { Task } from '../../lib/Queue'
import { MessageEmbed } from 'discord.js'
import { getUserDisplayName } from '../../lib/GetUserDisplayName'

export default {
  resolver: (text: string) => text.startsWith('quotes'),

  handler: async ({ message }: Task) => {
    const embed = new MessageEmbed().setColor('#a5c0d6')
    if (message.guild) embed.setAuthor('Quotes | GameMaker Italia', message.guild.iconURL())

    embed
      .setDescription('⚠️ __Non mettere `<>` o `[]` intorno ai parametri.__')
      .setFooter(`!quotes richiesto da ${getUserDisplayName(message)}`, message.author.displayAvatarURL())

    embed.addField('Comandi:', `\`!set <name>\` - Per salvare una citazione (ti chiederò subito dopo il testo da salvare)
\`!unset <name>\` - Cancella una citazione salvata
\`,<name>\` - Mostra il testo di una citazione
\`,<name> @user\` - Mostra la citazione di un utente
\`, @user\` - Mostra i nomi di tutte le citazioni di un utente`, false)

    embed.addField('Esempio:', `\`!set hello\` - Salva la citazione con il nome 'hello'
\`,hello\` - Mostra il valore associato (ad es. 'world')`, false)

    await message.channel.send(embed)
  }
}
