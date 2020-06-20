import { MessageEmbed } from 'discord.js'
import { Task } from '../../lib/Queue'
import { redis } from '../../lib/Redis'
import { NEWLINE } from '../../lib/utils/GetNewline'

export default {
  resolver: (text: string) => text.startsWith('cmd'),

  handler: async ({ message, text, reply }: Task) => {
    // Get the input
    const input = text.replace('cmd', '').trim()

    // Command help
    if (!input) {
      const embed = new MessageEmbed().setColor('#a5c0d6')
      if (message.guild) embed.setAuthor('Custom Commands | GameMaker Italia', message.guild.iconURL())

      embed.setDescription('Crea comandi personalizzati con javascript')

      embed.addField('Esempio:', '`!cmd set hello \'Ciao \' + authorNick + \'!\';`')

      embed.addField('Variabili disponibili:', '`text` `authorId` `authorUsername` `authorNick` `channelId` `channelName`')

      embed.addField('Comandi:', `\`!cmd set <name> <code>\` - Salva un comando (nome senza spazi)
\`!cmd unset <name>\` - Rimuove un comando
\`!cmd get <name>\` - Mostra il codice di un comando
\`!cmd list\` - Mostra la lista di comandi`, false)

      embed.addField('Nota:', 'Si riserva il diritto di rimuovere comandi qualora il trigger entri in conflitto con comandi ufficiali.')

      return await message.channel.send(embed)
    }

    if (input.startsWith('get')) {
      const name = input.replace('get ', '').trim()
      const cmdCode = await redis.hget('cmd:list', name)
      if (!cmdCode) return reply('non conosco questo comando. Scrivi `!cmd list` per la lista dei comandi personalizzati')
      return reply(`il codice del comando \`${name}\`:${NEWLINE}\`\`\`js${NEWLINE}${cmdCode.replace(/```/g, '\\`\\`\\`') + NEWLINE}\`\`\``)
    }

    if (input.startsWith('unset')) {
      const name = input.replace('unset ', '').trim()
      const cmd = await redis.hget('cmd:list', name)
      if (!cmd) return reply('non conosco questo comando. Scrivi `!cmd list` per la lista dei comandi personalizzati')
      await redis.hdel('cmd:list', name)
      return reply(`il comando '${name}' è stato rimosso`)
    }

    if (input.startsWith('set')) {
      const cleanText = input.replace('set ', '')
      let codeSep = cleanText.indexOf(' ')
      if (codeSep === -1) codeSep = cleanText.length
      const name = cleanText.slice(0, codeSep).trim()
      if (name.length > 25) return reply('il nome del comando è troppo lungo')
      const code = cleanText.slice(codeSep + 1).trim()
      if (!code) return reply('inserisci il codice del comando')
      await redis.hset('cmd:list', name, code)
      return reply(`il comando '${name}' è stato salvato`)
    }

    if (input.startsWith('list')) {
      let resp = ''
      const cmdList = await redis.hgetall('cmd:list')

      if (!cmdList || !Object.keys(cmdList).length) {
        return await reply('non ci sono comandi personalizzati')
      }

      Object.keys(cmdList).forEach(cmd => {
        resp += `\`${cmd}\`  `
      })

      return await message.channel.send(`**Lista dei comandi personalizzati:${NEWLINE + resp}**`)
    }
  }
}
