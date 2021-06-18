import { ApplicationCommand, ApplicationCommandData, CommandInteraction } from 'discord.js'

export interface InteractionConfig {
  interaction: ApplicationCommandData,
  onSetup?: (command: ApplicationCommand) => Promise<unknown>,
  handler: (message: CommandInteraction) => Promise<unknown>
}
