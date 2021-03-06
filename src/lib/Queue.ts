import crypto from 'crypto'
import { Message } from 'discord.js'
import logger from './Logger'
import { actions } from '../actions'
import {
  QUEUE_PENDING_CHECK_INTERVAL, QUEUE_CONCURRENT_TASKS, QUEUE_TASK_EXECUTION_TIMEOUT, DEBUG_ENABLED
} from './Config'
import { DOUBLE_NEWLINE } from './utils/GetNewline'

export interface Task {
  action: string;
  text: string;
  message: Message;
  reply?: Message['reply'];
}

const pendingQueue = new Map<string, { handler; task: Task }>()
const executingQueue = new Map()
const origChSendMap = {}

const executeTask = (id: string, handler, task: Task) => {
  const origHandler = handler.bind(null)

  handler = async (...args) => {
    let startTime = process.hrtime()
    let execTime: string

    if (DEBUG_ENABLED) {
      // Override the handler to log the exec time
      const origReply = task.message.reply.bind(task.message)
      if (!origChSendMap[task.message.channel.id]) {
        origChSendMap[task.message.channel.id] = task.message.channel.send.bind(task.message.channel)
      }

      const getTimeText = () => {
        const endTime = process.hrtime(startTime)
        startTime = process.hrtime()
        execTime = ~~(endTime[0] * 1000 + (endTime[1] / 1e6)) + 'ms'
        return `${DOUBLE_NEWLINE}\`DEBUG MODE: Command executed in ${execTime}\``
      }

      const measureTime = (args) => {
        if (typeof args[0] === 'string') {
          args[0] += getTimeText()
        } else if (typeof args[0] === 'object' && args[0].constructor.name === 'MessageEmbed') {
          args[0].addField('Bot:', getTimeText())
        } else if (typeof args[0] === 'object' && args[0].embed) {
          args[0].embed.addField('Bot:', getTimeText())
        }
      }

      task.message.reply = (...args) => {
        measureTime(args)
        return origReply(...args)
      }

      task.message.channel.send = (...args) => {
        measureTime(args)
        return origChSendMap[task.message.channel.id](...args)
      }
    }

    await origHandler(...args)

    // Log the exec time
    if (!execTime) {
      const endTime = process.hrtime(startTime)
      execTime = ~~(endTime[0] * 1000 + (endTime[1] / 1e6)) + 'ms'
    }
    logger.trace(`[QUEUE] Task '${task.action}' executed in ${execTime}`)
  }

  executingQueue.set(id, null)

  // Start the timeout promise
  let taskTimeout: NodeJS.Timeout
  const timeoutPromise = new Promise<void>(resolve => {
    taskTimeout = setTimeout(() => {
      logger.error(`[QUEUE] Job ${id} execution timeout. Action: ${task.action}. Message: ${task.message.content}`)
      resolve()
    }, QUEUE_TASK_EXECUTION_TIMEOUT)
  })

  // Execute the task handler, while also racing with the timeout promise
  Promise.race([timeoutPromise, handler()])
    .then(() => {
      clearTimeout(taskTimeout)
      executingQueue.delete(id)
    })
    .catch(() => {
      clearTimeout(taskTimeout)
      executingQueue.delete(id)
    })
}

export const enqueue = async (queueTask: Task): Promise<void> => {
  // Execute the task
  const taskFn = async (task: Task) => {
    try {
      task.reply = task.message.reply.bind(task.message)
      await actions.get(task.action).handler(task)
    } catch (err) {
      logger.error('[QUEUE] Task execution error:')
      logger.error(err)
      task.message.reply('è avvenuto un errore mentre eseguivo la richiesta')
        .catch((err: Error) => logger.error(err))
    }
  }

  // Add the job to the queue
  const jobId = crypto.randomBytes(16).toString('hex')
  const jobHandler = taskFn.bind(null, queueTask)

  if (executingQueue.size < QUEUE_CONCURRENT_TASKS) {
    executeTask(jobId, jobHandler, queueTask)
  } else {
    pendingQueue.set(jobId, { task: queueTask, handler: taskFn.bind(null, queueTask) })
  }
}

/* Process the pending queue */
export const processQueue = () => {
  for (const [jobId, jobData] of pendingQueue) {
    if (executingQueue.size >= QUEUE_CONCURRENT_TASKS) break
    pendingQueue.delete(jobId)
    executeTask(jobId, jobData.handler, jobData.task)
  }

  setTimeout(processQueue, QUEUE_PENDING_CHECK_INTERVAL)
}

export const start = () => {
  processQueue()
  logger.info('[QUEUE] Ready')
}
