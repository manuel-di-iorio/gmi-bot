import { Task } from '../lib/Queue'

export default {
  resolver: (text: string) => text.startsWith('🍌') || text.startsWith('banana'),

  handler: async ({ message }: Task) => {
    await message.channel.send(`${message.author} :banana:
**Game maker 8.0**
<https://mega.nz/#!aI42AC7Y!f24zh8QSu7OrQ4A7VgEuadEJS_HWsGxJHhfgrzFjAV0>

**Game maker 8.1**
<https://mega.nz/#!fQomRQLA!0Tf0tjG_TCCIUm5fa3G5Y7sr0xYixY-dMXWUWQiLS2Q>

**Game maker studio 1.4.9999**
<https://mega.nz/#!GJgDxaAS!PvsUSQFZhNFOVBqa8RKvbnbXtD7Slm_u20Zpx-BGBws>`)
  }
}
