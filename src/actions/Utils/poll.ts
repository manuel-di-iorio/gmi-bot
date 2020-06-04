import async from 'async'
import { Task } from '../../lib/Queue'
import { NEWLINE, DOUBLE_NEWLINE } from '../../lib/utils/GetNewline'
import { getUserDisplayName } from '../../lib/utils/GetUserDisplayName'
import logger from '../../lib/Logger'

const alphabetClean = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']
const alphabet = ['🇦', '🇧', '🇨', '🇩', '🇪', '🇫', '🇬', '🇭', '🇮', '🇯', '🇰', '🇱', '🇲', '🇳', '🇴', '🇵', '🇶', '🇷', '🇸', '🇹', '🇺', '🇻', '🇼', '🇽', '🇾', '🇿']

export default {
  resolver: (text: string) => text.startsWith('poll'),

  handler: async ({ message, reply, text }: Task) => {
    // return reply('i poll non sono ancora disponibili!')

    // Get the input
    const input = text.replace('poll', '').trim()
    if (!input) {
      return await Promise.all([
        message.delete(),
        reply(`specifica la domanda e le opzioni del sondaggio, separati da |${NEWLINE}Esempio: \`!poll domanda?|opzione 1|opzione 2|ecc..\``)
      ])
    }

    // Get the question and options
    const params = input.split('|')
    if (params.length < 3) {
      return await Promise.all([
        message.delete(),
        reply(`specifica una domanda e almeno due opzioni, separati da |${NEWLINE}Esempio: \`!poll domanda?|opzione 1|opzione 2|ecc..\``)
      ])
    } else if (params.length > 27) {
      return await Promise.all([
        message.delete(),
        reply('puoi mettere massimo 26 opzioni')
      ])
    }

    message.delete().catch((err: Error) => logger.error(err))

    const question = params.shift().trim()
    const answers = params.map(param => param.trim())
    const expiration = 1000 * 60 * 2

    // Add the poll message with the reactions
    const reactAnswers = answers.map((param, idx) => (`${alphabetClean[idx]}) ${param}`)).join(NEWLINE)
    const pollMsg = await message.channel.send(`\`\`\`${getUserDisplayName(message)} ha creato un sondaggio che terminerà tra 2 minuti:${NEWLINE}${question}${DOUBLE_NEWLINE + reactAnswers}\`\`\``)

    const msgReactions = answers.map((param, idx) => async () => (pollMsg.react(alphabet[idx])))
    await async.parallelLimit(msgReactions, 4)

    // Handle the poll end
    setTimeout(async () => {
      // Get and sort the votes
      const votes = new Array(answers.length).fill(0).map((_, idx) => ({ count: 0, answer: answers[idx] }))
      const allowedReactions = alphabet.slice(0, answers.length)

      const reactions = pollMsg.reactions.cache
      reactions.forEach(({ emoji: { name }, count }) => {
        if (!allowedReactions.includes(name)) return
        votes[alphabet.indexOf(name)].count = count
      })
      const sortedVotes = votes.sort((a, b) => b.count - a.count)

      // Map the results
      const results = sortedVotes.map((vote, idx) => {
        const count = Math.max(0, vote.count - 1)
        const votesPlural = count === 1 ? 'o' : 'i'
        return `${idx + 1}) ${vote.answer} (${count} vot${votesPlural})`
      }).join(NEWLINE)

      // Get the winner vote
      let winnerText: string
      if (sortedVotes[0].count > sortedVotes[1].count) {
        winnerText = `Il vincitore è: ${sortedVotes[0].answer}`
      } else {
        winnerText = 'Il sondaggio è finito in parità!'
      }

      // Send the poll results
      try {
        await message.channel.send(`${message.author}, il sondaggio è terminato!${NEWLINE}\`\`\`Domanda: ${question + DOUBLE_NEWLINE}Risultati:${NEWLINE + results + DOUBLE_NEWLINE}${winnerText}\`\`\``)
      } catch (err) {
        logger.error(err)
      }
    }, expiration)
  }
}
