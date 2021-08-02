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
  GMI_FORUM_CHANNEL,
  GMI_QUESTIONS_CH_ID,
  DROPBOX_CLIENT_ID,
  DROPBOX_ACCESS_TOKEN,
  BOT_AUTHOR_ID,
  BACKUP_FREQUENCY,
  DB_CONTROL_FREQUENCY,
  TENOR_APIKEY,
  TWITCH_CLIENT_ID,
  TWITCH_SECRET,
  TWITCH_USER_ID,
  EVENT_COUNTDOWN_ONEBIT_CHANNEL
} = process.env

export const BOT_COLOR = '#f59342'
export const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379')
export const GMI_ADMIN_ROLES = process.env.GMI_ADMIN_ROLES.split(',')
export const QUEUE_PENDING_CHECK_INTERVAL = parseInt(process.env.QUEUE_PENDING_CHECK_INTERVAL)
export const QUEUE_CONCURRENT_TASKS = parseInt(process.env.QUEUE_CONCURRENT_TASKS)
export const QUEUE_TASK_EXECUTION_TIMEOUT = parseInt(process.env.QUEUE_TASK_EXECUTION_TIMEOUT)
export const BACKUP_ENABLED = process.env.BACKUP_ENABLED === 'true'
export const DEBUG_ENABLED = process.env.DEBUG_ENABLED === 'true'
export const FORCE_SYNC_INTERACTIONS = process.env.FORCE_SYNC_INTERACTIONS === 'true'
export const TWITCH_API_LOGIN_HOST = 'https://id.twitch.tv'
export const TWITCH_API_HOST = 'https://api.twitch.tv/helix'
export const OPEN_WEATHER_MAP_HOST = 'https://api.openweathermap.org/data/2.5'
export const OPEN_WEATHER_MAP_APIKEY = process.env.OPEN_WEATHER_MAP_APIKEY
