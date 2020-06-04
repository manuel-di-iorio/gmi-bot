import { Task } from '../lib/Queue'
import { MessageEmbed } from 'discord.js'
import { getUserDisplayName } from '../lib/utils/GetUserDisplayName'
import logger from '../lib/Logger'

export default {
  resolver: (text: string) => text === 'help',

  handler: async ({ message }: Task) => {
    const embed = new MessageEmbed().setColor('#a5c0d6')
    if (message.guild) embed.setAuthor('GameMaker Italia', message.guild.iconURL())

    embed
      .setDescription('⚠️ __Non mettere `<>` o `[]` intorno ai parametri.__')
      .setFooter(`!help richiesto da ${getUserDisplayName(message)}`, message.author.displayAvatarURL())

    // Server
    embed.addField('Server', `\`!avatar [@user]\` - Mostra l'avatar di un utente
\`!logo\` - Mostra il logo del server
\`!log\` - Allega il log degli ultimi messaggi di questo canale
\`!emotes [page=1]\` - Mostra la classifica delle emotes del server
\`!del <num or text>\` - Cancella i messaggi (!del per info)
\`!quotes\` - Mostra i comandi per salvare o mostrare un messaggio
\`!stats [@user]\` - Mostra le statistiche di un utente`, false)

    // Reminders
    embed.addField('Reminders', `\`!remind <text>\` - Setta un reminder (!remind per info)
\`!remind show\` - Mostra tutti i reminders
\`!remind remove <id>\` - Cancella un reminder`, false)

    // Utils
    embed.addField('Utils', `\`!poll question|answer1|answer2|etc..\` - Crea un sondaggio
\`!code <code>\` - Formatta il codice
\`!exec <code>\` - Esegue il codice javascript e mostra il risultato
\`!yt <query>\` - Cerca un video su YouTube
\`!google <query>\` - Cerca su Google`, false)

    message.delete().catch((err: Error) => logger.error(err))
    await message.channel.send(embed)
  }
}
