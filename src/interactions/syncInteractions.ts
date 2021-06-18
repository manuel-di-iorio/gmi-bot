import { TextChannel } from 'discord.js'
import logger from '../lib/Logger'
import { interactions } from '.'
import { FORCE_SYNC_INTERACTIONS } from '../lib/Config'

export const syncInteractionCommands = async (mainChannel: TextChannel) => {
  const commands = mainChannel.guild.commands
  const oldCommands = []
  const editCommands = []
  const newCommands = []
  const existingCmdNames = {}

  try {
    await commands.fetch()
    const commandsCache = commands.cache

    // Delete or edit old commands
    for (const command of commandsCache.values()) {
      existingCmdNames[command.name] = true

      const interaction = interactions[command.name]
      if (FORCE_SYNC_INTERACTIONS || !interaction) {
        oldCommands.push(() => commands.delete(command.id))
      } else if (interaction.version > interaction.oldVersion) {
        editCommands.push(() => commands.edit(command.id, interaction.interaction))
      }
    }

    // Create new commands
    for (const name of Object.keys(interactions)) {
      if (!FORCE_SYNC_INTERACTIONS && existingCmdNames[name]) continue
      newCommands.push(() => commands.create(interactions[name].interaction))
    }

    await oldCommands.map(task => task())
    await editCommands.map(task => task())
    await newCommands.map(task => task())

    if (oldCommands.length) logger.debug(`[Sync Interactions] ${oldCommands.length} command${oldCommands.length !== 1 ? 's' : ''} deleted`)
    if (editCommands.length) logger.debug(`[Sync Interactions] ${editCommands.length} command${editCommands.length !== 1 ? 's' : ''} edited`)
    if (newCommands.length) logger.debug(`[Sync Interactions] ${newCommands.length} command${newCommands.length !== 1 ? 's' : ''} added`)
  } catch (err) {
    logger.error(err)
  }
}
