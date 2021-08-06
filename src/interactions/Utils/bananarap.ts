import { CommandInteraction } from 'discord.js'

export const bananarapInteraction = {
  interaction: {
    name: 'bananarap',
    description: 'Mostra i link delle vecchie versioni di GameMaker Studio'
  },

  handler: async (message: CommandInteraction) => {
    await message.deferReply({ ephemeral: true })
    await message.editReply(`:banana:
**GameMaker 8.0**
<https://mega.nz/#!aI42AC7Y!f24zh8QSu7OrQ4A7VgEuadEJS_HWsGxJHhfgrzFjAV0>

**GameMaker 8.1**
<https://mega.nz/#!fQomRQLA!0Tf0tjG_TCCIUm5fa3G5Y7sr0xYixY-dMXWUWQiLS2Q>

**GameMaker Studio 1.4.9999**
<https://mega.nz/#!GJgDxaAS!PvsUSQFZhNFOVBqa8RKvbnbXtD7Slm_u20Zpx-BGBws>

**GameMaker Studio 2.3.0.529**
<https://www.youtube.com/watch?v=8xLlRkG9W_Y>`)
  }
}
