import natural from 'natural'
import { Action } from '../actions'

const { JaroWinklerDistance } = natural

export const init = (actions: Map<string, Action>) => {
  const corpus = []
  for (const [, { cmd }] of actions) {
    cmd && (Array.isArray(cmd) ? cmd.forEach(item => corpus.push(item)) : corpus.push(cmd))
  }

  const { length } = corpus
  spellcheck.getCorrection = (text: string) => {
    for (let i = 0; i < length; i++) {
      const correction = corpus[i]
      if (JaroWinklerDistance(text, correction) > 0.82) return correction
    }
  }
}

export const spellcheck: { getCorrection?: (text: string) => string | null } = {
  getCorrection: null
}
