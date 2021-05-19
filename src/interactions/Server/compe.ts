import { ApplicationCommandOptionType } from 'discord-api-types'
import { CommandInteraction } from 'discord.js'
import axios from 'axios'
import { NEWLINE } from '../../lib/utils/GetNewline'

const cache = {}

export const compeInteraction = {
  version: 0,
  oldVersion: 0,

  interaction: {
    name: 'compe',
    description: 'Mostra i risultati delle competizioni GMI',
    options: [{
      name: 'name',
      type: ApplicationCommandOptionType.STRING,
      description: 'Nome o anno'
    }]
  },

  handler: async (message: CommandInteraction) => {
    const contestName = !message.options.size
      ? new Date().getFullYear().toString()
      : message.options.first().value as string

    const cached = cache[contestName]
    if (cached) return message.reply(cached)

    // Find the contest ID into the contests list
    const { data: { contests } } = await axios('https://gmitalia.altervista.org/api/contests.php')
    const contest = contests.find(contest => new RegExp(contestName).test(contest.name))
    if (!contest) return message.reply('Non ho trovato una competizione con questo nome')

    // Get the results
    const { data: { results } } = await axios(`https://gmitalia.altervista.org/api/results.php?ctx=${contest.id}`)
    if (!results || !results.length) return message.reply(`Non ci sono risultati salvati per la competizione '${contestName}'`)

    // Build the response
    let response = `**CLASSIFICA ${contest.name.toUpperCase()}**${NEWLINE}\`\`\`${NEWLINE}`
    for (let i = 0, l = results.length; i < l; i++) {
      const result = results[i]
      response += `${i + 1}) ${result.game_name} di ${result.game_author} (voto: ${result.final_score})${NEWLINE}`
    }
    response += '```'

    // Cache and send the response
    cache[contestName] = response
    return message.reply(response)
  }
}
