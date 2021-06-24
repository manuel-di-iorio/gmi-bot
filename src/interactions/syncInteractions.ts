import { TextChannel } from 'discord.js'
import logger from '../lib/Logger'
import { interactions } from '.'
import { FORCE_SYNC_INTERACTIONS } from '../lib/Config'

export const syncInteractionCommands = async (mainChannel: TextChannel) => {
  const commands = mainChannel.guild.commands
  const oldCommands = []
  const newCommands = []
  const existingCmdNames = {}

  try {
    await commands.fetch()
    const commandsCache = commands.cache

    // Delete old commands
    for (const command of commandsCache.values()) {
      existingCmdNames[command.name] = true

      const interaction = interactions[command.name]
      if (FORCE_SYNC_INTERACTIONS || !interaction) {
        oldCommands.push(() => commands.delete(command.id))
      }
    }

    // Create new commands
    for (const name of Object.keys(interactions)) {
      if (!FORCE_SYNC_INTERACTIONS && existingCmdNames[name]) continue
      const cmdConfig = interactions[name]

      newCommands.push(async () => {
        const cmd = await commands.create(cmdConfig.interaction)
        if (cmdConfig.onSetup) await cmdConfig.onSetup(cmd)
      })
    }

    await oldCommands.map(task => task())
    await newCommands.map(task => task())

    if (oldCommands.length) {
      logger.debug(`[Sync Interactions] ${oldCommands.length} command${oldCommands.length !== 1 ? 's' : ''} deleted`)
    }

    if (newCommands.length) {
      logger.debug(`[Sync Interactions] ${newCommands.length} command${newCommands.length !== 1 ? 's' : ''} added`)
    }
  } catch (err) {
    logger.error(err)
  }
}
