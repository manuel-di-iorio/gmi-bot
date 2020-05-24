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

interface Action {
  resolver: (text: string) => boolean;
  handler: (task: Task) => Promise<any>;
}

export const actions = new Map<string, Action>([
  ['help', help],
  ['quotesShow', quotesShow],
  ['quotesSet', quotesSet],
  ['quotesUnset', quotesUnset],
  ['quotes', quotes],
  ['avatar', avatar],
  ['logo', logo],
  ['youtube', youtube],
  ['google', google],
  ['log', log],
  ['code', code],
  ['exec', exec],
  ['emotes', emotes],
  ['delete', deleteCmd],
  ['remindRemove', remindRemove],
  ['remindShow', remindShow],
  ['remind', remind],
  ['cmdNotFound', cmdNotFound]
])
