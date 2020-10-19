import axios from 'axios'
import { Task } from '../../lib/Queue'
import { NEWLINE } from '../../lib/utils/GetNewline'

const cache = {}

export default {
  cmd: 'compe',

  handler: async ({ message, reply, text }: Task) => {
    // Get the contest name from the input
    let contestName = text.replace('compe', '').trim()
    if (!contestName) contestName = new Date().getFullYear().toString()

    const cached = cache[contestName]
    if (cached) return message.channel.send(cached)

    // Find the contest ID into the contests list
    const { data: { contests } } = await axios('http://gmitalia.altervista.org/api/contests.php')
    const contest = contests.find(contest => new RegExp(contestName).test(contest.name))
    if (!contest) return reply('non ho trovato una competizione con questo nome')

    // Get the results
    const { data: { results } } = await axios(`http://gmitalia.altervista.org/api/results.php?ctx=${contest.id}`)
    if (!results || !results.length) return reply('non ci sono risultati salvati per questa competizione')

    // Build the response
    let response = `**CLASSIFICA ${contest.name.toUpperCase()}**${NEWLINE}\`\`\`${NEWLINE}`
    for (let i = 0, l = results.length; i < l; i++) {
      const result = results[i]
      response += `${i + 1}) ${result.game_name} di ${result.game_author} (voto: ${result.final_score})${NEWLINE}`
    }
    response += '```'

    // Cache and send the response
    cache[contestName] = response
    return message.channel.send(response)
  }
}
