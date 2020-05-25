import { start as startPool } from 'parallelcode'
import logger from './Logger'

export const start = async () => {
  await startPool({
    workers: 4,
    onThreadStart: () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { VM } = require('vm2')
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      THREAD_STATE.vm = new VM({ // eslint-disable-line
        timeout: 1000 * 5,
        sandbox: {},
        eval: false,
        wasm: false,
        fixAsync: true
      })
    }
  })

  logger.info('[WORKERS] Ready')
}
