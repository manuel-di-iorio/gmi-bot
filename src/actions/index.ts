import { Task } from '../lib/Queue'
import cmdNotFound from './notFound'
import help from './help'
import quotes from './Quotes/help'
import quotesSet from './Quotes/set'
import quotesUnset from './Quotes/unset'
import quotesShow from './Quotes/show'
import avatar from './Server/avatar'
import logo from './Server/logo'
import youtube from './Utils/youtube'
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
import indiexpo from './indiexpo'
import bday from './Server/bday'
import diff from './Utils/diff'
import forum from './Server/forum'
import diff2 from './Utils/diff2'
import nick from './Server/nick'

interface Action {
  resolver: (text: string) => boolean;
  handler: (task: Task) => Promise<any>;
}

export const actions = new Map<string, Action>([
  ['help', help],
  ['diff2', diff2],
  ['diff', diff],
  ['quotesShow', quotesShow],
  ['quotesSet', quotesSet],
  ['quotesUnset', quotesUnset],
  ['quotes', quotes],
  ['avatar', avatar],
  ['logo', logo],
  ['bday', bday],
  ['youtube', youtube],
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
  // ['bot:users:gems', indiexpo],
  ['forum', forum],
  ['cmdNotFound', cmdNotFound]
])
