import natural from 'natural'
import { Action } from '../actions'

interface Correction {
  action: string,
  cmd: string
}

const { JaroWinklerDistance } = natural
const corpus: Correction[] = []
let actionsCount: number

/**
 * Initialize the corrections list
 */
export const init = (actions: Map<string, Action>) => {
  for (const [action, { cmd }] of actions) {
    // Note: some 'cmd' values are array because those commands support multiple word triggers
    cmd && (Array.isArray(cmd)
      ? cmd.forEach(item => corpus.push({ action, cmd: item }))
      : corpus.push({ action, cmd })
    )
  }

  // Cache the actions count
  actionsCount = corpus.length
}

/**
 * Get a corrected action based on the string distance
 */
export const getCorrection = (text: string): Correction | null => {
  for (let i = 0; i < actionsCount; i++) {
    const correction = corpus[i]
    if (JaroWinklerDistance(text, correction.cmd) > 0.82) return correction
  }
}
