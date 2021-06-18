import { Task } from '../../lib/Queue'
import { MessageEmbed } from 'discord.js'
import { getUserDisplayName } from '../../lib/utils/GetUserDisplayName'
import { BOT_COLOR } from '../../lib/Config'

export default {
  cmd: 'help',

  handler: async ({ message }: Task) => {
    const embed = new MessageEmbed().setColor(BOT_COLOR)

    embed.setDescription('ATTENZIONE: Molti comandi sono stati integrati con Discord! Scrivi / per mostrarli')

    if (message.guild) {
      embed.setAuthor('Bot | GameMaker Italia', message.guild.iconURL(), 'https://github.com/manuel-di-iorio/gmi-bot')
    }

    embed.setFooter(`!help richiesto da ${getUserDisplayName(message)}`, message.author.displayAvatarURL())

    // Server
    embed.addField('Comandi', `\`!bday DD/MM/YYYY\` - Setta il tuo compleanno (giorno/mese/anno)
\`!channel\` - Mostra i comandi relativi ai canali temporanei
\`!poll question|answer1|answer2|etc..\` - Crea un sondaggio
\`!quotes\` - Mostra i comandi per salvare o mostrare un messaggio
\`!remind\` - Mostra i comandi per i reminder
\`!code <code>\` - Formatta il codice
\`!exec <code>\` - Esegue il codice javascript e mostra il risultato`, false)

    await message.channel.send({ embeds: [embed] })
  }
}
