import logger from '../../lib/Logger'
import { Task } from '../../lib/Queue'
import { NEWLINE } from '../../lib/utils/GetNewline'

export default {
  cmd: 'questions',

  handler: async ({ message }: Task) => {
    // Delete the author message
    if (message.guild) {
      message.delete().catch((err: Error) => logger.error(err))
    }

    await message.channel.send(`1) Conosci Game Maker ?${NEWLINE}2) Conosci Peggle ?${NEWLINE}3) Usi Unity ?${NEWLINE}4) Giochi a League of Legends ?`)
  }
}
