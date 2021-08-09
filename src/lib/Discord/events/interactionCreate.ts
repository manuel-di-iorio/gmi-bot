import { Interaction } from 'discord.js'
import { interactions } from '../../../interactions'
import logger from '../../Logger'

export const interactionCreate = async (interaction: Interaction) => {
  if (!interaction.isCommand()) return
  const { commandName } = interaction

  try {
    const startTime = process.hrtime()
    await interactions[commandName].handler(interaction)
    const endTime = process.hrtime(startTime)
    const execTime = ~~(endTime[0] * 1000 + (endTime[1] / 1e6)) + 'ms'
    logger.trace(`[QUEUE] Interaction task '${commandName}' executed in ${execTime}`)
  } catch (err) {
    logger.error(err)

    const reply = !interaction.deferred ? interaction.reply.bind(interaction) : interaction.editReply.bind(interaction)
    reply('È avvenuto un errore mentre eseguivo la richiesta')
      .catch((err: Error) => logger.error(err))
  }
}
