import { Task } from '../lib/Queue'
import cmdNotFound from './Server/notFound'
import help from './Server/help'
import quotes from './Quotes/help'
import quotesSet from './Quotes/set'
import quotesUnset from './Quotes/unset'
import quotesShow from './Quotes/show'
import quotesList from './Quotes/list'
import remindRemove from './Reminders/remindRemove'
import remindShow from './Reminders/remindShow'
import remind from './Reminders/remind'
// import deleteCmd from './Server/del'
import poll from './Utils/poll'
import bday from './Server/bday'
import botRestore from './Server/bot-restore'
import { Message } from 'discord.js'
// import channel from './Discussions/channel'
// import channelRemove from './Discussions/remove'
// import channelRename from './Discussions/rename'
// import channelTopic from './Discussions/topic'
import code from './Utils/code'
import exec from './Utils/exec'

export interface Action {
  cmd?: string | string[],
  resolver?: (text: string, message?: Message, reply?: Message['reply']) => boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: (task: Task) => any;
}

export const actions = new Map<string, Action>([
  ['help', help],
  ['quotesShow', quotesShow],
  ['quotesSet', quotesSet],
  ['quotesUnset', quotesUnset],
  ['quotesList', quotesList],
  ['quotes', quotes],
  ['bday', bday],
  ['poll', poll],
  // ['delete', deleteCmd],
  ['remindRemove', remindRemove],
  ['remindShow', remindShow],
  ['remind', remind],
  // ['channelRemove', channelRemove],
  // ['channelRename', channelRename],
  // ['channelTopic', channelTopic],
  // ['channel', channel],
  ['code', code],
  ['exec', exec],
  ['bot:restore', botRestore],
  ['cmdNotFound', cmdNotFound]
])
