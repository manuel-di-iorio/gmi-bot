import { Task } from '../../lib/Queue'
import { NEWLINE } from '../../lib/utils/GetNewline'

export default {
  cmd: 'questions',

  handler: async ({ message }: Task) => {
    await message.channel.send(`1) Conosci Game Maker ?${NEWLINE}2) Conosci Peggle ?${NEWLINE}3) Usi Unity ?${NEWLINE}4) Giochi a League of Legends ?`)
  }
}
