import { Task } from '../../lib/Queue'
import { MessageEmbed } from 'discord.js'
import { getUserDisplayName } from '../../lib/utils/GetUserDisplayName'

export default {
  cmd: 'help',

  handler: async ({ message }: Task) => {
    const embed = new MessageEmbed().setColor('#b959b6')
    if (message.guild) {
      embed.setAuthor('Bot | GameMaker Italia', message.guild.iconURL(), 'https://github.com/manuel-di-iorio/gmi-bot')
    }

    embed.setFooter(`!help richiesto da ${getUserDisplayName(message)}`, message.author.displayAvatarURL())

    // Server
    embed.addField('Server', `\`!avatar [@user]\` - Mostra l'avatar di un utente
\`!logo\` - Mostra il logo del server
\`!nick <name>\` - Cambia il tuo nickname
\`!emote\` - Mostra la classifica delle emotes del server
\`!stats [@user]\` - Mostra le statistiche di un utente
\`!bday DD/MM/YYYY\` - Setta il tuo compleanno (giorno/mese/anno)
\`!city <name>\` - Setta la tua città
\`!compe <name>\` - Mostra i risultati di una competizione GMI
\`!log\` - Allega il log degli ultimi messaggi di questo canale
\`!channel\` - Crea un canale per una discussione temporanea
\`!doc <query>\` - Linka il manuale di GameMaker Studio 2`, false)

    // Utils
    embed.addField('Utils', `\`!poll question|answer1|answer2|etc..\` - Crea un sondaggio
\`!quotes\` - Mostra i comandi per salvare o mostrare un messaggio
\`!code <code>\` - Formatta il codice
\`!exec <code>\` - Esegue il codice javascript e mostra il risultato
\`!yt <query>\` - Cerca un video su YouTube
\`!google <query>\` - Cerca su Google`, false)

    await message.channel.send(embed)
  }
}

// \`!remind\` - Setta un reminder
// sotto code
