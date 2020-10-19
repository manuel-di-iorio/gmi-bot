import { job } from 'parallelcode'
import { Task } from '../../lib/Queue'

export default {
  cmd: 'exec',

  handler: async ({ text, reply }: Task) => {
    const data = text.replace('exec', '').trim()

    try {
      // @ts-ignore
      // eslint-disable-next-line no-undef
      const ctx = await job(({ data }) => (THREAD_STATE.vm.run(data)), { data })
      const { result } = await ctx.onDone
      await reply(`risultato: ${result}`)
    } catch (err) {
      await reply(`errore nell'esecuzione: ${err.message}`)
    }
  }
}
