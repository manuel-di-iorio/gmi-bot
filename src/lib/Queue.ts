import crypto from 'crypto'
import { Message } from 'discord.js'
import logger from './Logger'
import { actions } from '../actions'
import { bot } from './Discord'
import { QUEUE_PENDING_CHECK_INTERVAL, QUEUE_CONCURRENT_TASKS, QUEUE_TASK_EXECUTION_TIMEOUT } from './Config'

export interface Task {
  action: string;
  text: string;
  message: Message;
  reply?: Message['reply'];
}

const pendingQueue = new Map<string, { handler: Function; task: Task }>()
const executingQueue = new Map<string, Function>()

const executeTask = (id: string, handler: Function, task: Task) => {
  executingQueue.set(id, null)

  // Start the timeout promise
  let taskTimeout: NodeJS.Timeout
  const timeoutPromise = new Promise(resolve => {
    taskTimeout = setTimeout(() => {
      logger.error(`[Queue] Job ${id} execution timeout. Action: ${task.action}. Message: ${task.message.content}`)
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
      task.message.reply('è avvenuto un errore mentre eseguivo la richiesta').catch((err: Error) => logger.error(err))
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
