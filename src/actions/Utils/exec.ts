import { job } from 'parallelcode'
import { Task } from '../../lib/Queue'

export default {
  resolver: (text: string) => text.startsWith('exec'),

  handler: async ({ text, reply }: Task) => {
    const data = text.replace('exec', '').trim()

    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      const ctx = await job(({ data }) => (THREAD_STATE.vm.run(data)), { data })
      const { result } = await ctx.onDone
      await reply(`risultato dell'esecuzione: ${result}`)
    } catch (err) {
      await reply(`errore nell'esecuzione: ${err.message}`)
    }
  }
}
