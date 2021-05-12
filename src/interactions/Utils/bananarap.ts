import { CommandInteraction } from "discord.js";

export const bananarapInteraction = {
  version: 0,
  oldVersion: 0,

  interaction: {
    name: 'bananarap',
    description: 'Mostra i link delle vecchie versioni di GameMaker Studio'
  },

  handler: async (message: CommandInteraction) => {
    await message.user.send(`:banana:
**Game maker 8.0**
<https://mega.nz/#!aI42AC7Y!f24zh8QSu7OrQ4A7VgEuadEJS_HWsGxJHhfgrzFjAV0>

**Game maker 8.1**
<https://mega.nz/#!fQomRQLA!0Tf0tjG_TCCIUm5fa3G5Y7sr0xYixY-dMXWUWQiLS2Q>

**Game maker studio 1.4.9999**
<https://mega.nz/#!GJgDxaAS!PvsUSQFZhNFOVBqa8RKvbnbXtD7Slm_u20Zpx-BGBws>`)

    await message.defer(true)
    await message.editReply("Hai un PM :banana:")
  }
}

