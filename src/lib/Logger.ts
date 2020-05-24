import pino from 'pino'
import { LOG_LEVEL } from './Config'

const logger = pino({
  level: LOG_LEVEL,
  prettyPrint: {
    colorize: true,
    translateTime: 'yyyy-mm-dd HH:MM:ss',
    ignore: 'pid,hostname'
  }
})

export default logger
