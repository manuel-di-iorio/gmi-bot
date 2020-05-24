import dotenv from 'dotenv'

dotenv.config()

export const {
  NODE_ENV,
  LOG_LEVEL,
  BOT_TOKEN,
  REDIS_URL,
  JAWSDB_MARIA_URL,
  GOOGLE_APIKEY,
  GOOGLE_SEARCH_CX,
  GMI_GUILD,
  GMI_LIMITED_CHS_LINK_OR_IMG,
  GMI_LIMITED_CHS_LIMIT_LINK,
  GMI_MEMBER_ROLE,
  GMI_FORUM_CHANNEL
} = process.env

export const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379')
export const GMI_ADMIN_ROLES = process.env.GMI_ADMIN_ROLES.split(',')
export const QUEUE_PENDING_CHECK_INTERVAL = parseInt(process.env.QUEUE_PENDING_CHECK_INTERVAL)
export const QUEUE_CONCURRENT_TASKS = parseInt(process.env.QUEUE_CONCURRENT_TASKS)
export const QUEUE_TASK_EXECUTION_TIMEOUT = parseInt(process.env.QUEUE_TASK_EXECUTION_TIMEOUT)
