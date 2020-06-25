import { Task } from '../lib/Queue'
import cmdNotFound from './notFound'
import help from './help'
import quotes from './Quotes/help'
import quotesSet from './Quotes/set'
import quotesUnset from './Quotes/unset'
import quotesShow from './Quotes/show'
import avatar from './Server/avatar'
import logo from './Server/logo'
import google from './Utils/google'
import log from './Server/log'
import code from './Utils/code'
import exec from './Utils/exec'
import emotes from './Server/emotes'
import remindRemove from './Reminders/remindRemove'
import remindShow from './Reminders/remindShow'
import remind from './Reminders/remind'
import deleteCmd from './Server/del'
import poll from './Utils/poll'
import stats from './Server/stats'
import bday from './Server/bday'
import diff from './Utils/diff'
import forum from './Server/forum'
import nick from './Server/nick'
import botRestore from './Server/bot-restore'
import cmd from './Server/cmd'
import cmdExec from './Server/cmdExec'
import { Message } from 'discord.js'
import yt from './Utils/yt'

interface Action {
  resolver: (text: string, message?: Message, reply?: Message['reply']) => boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: (task: Task) => any;
}

export const actions = new Map<string, Action>([
  ['help', help],
  ['diff', diff],
  ['quotesShow', quotesShow],
  ['quotesSet', quotesSet],
  ['quotesUnset', quotesUnset],
  ['quotes', quotes],
  ['avatar', avatar],
  ['logo', logo],
  ['bday', bday],
  ['yt', yt],
  ['google', google],
  ['poll', poll],
  ['log', log],
  ['code', code],
  ['exec', exec],
  ['nick', nick],
  ['emotes', emotes],
  ['stats', stats],
  ['delete', deleteCmd],
  ['remindRemove', remindRemove],
  ['remindShow', remindShow],
  ['remind', remind],
  ['forum', forum],
  ['bot:restore', botRestore],
  ['cmd', cmd],
  ['cmdExec', cmdExec],
  ['cmdNotFound', cmdNotFound]
])
