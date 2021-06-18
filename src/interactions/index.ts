import { avatarInteraction } from './Server/avatar'
import { logoInteraction } from './Server/logo'
import { ytInteraction } from './Utils/yt'
import { googleInteraction } from './Utils/google'
import { colorInteraction } from './Utils/color'
import { bananarapInteraction } from './Utils/bananarap'
import { docInteraction } from './Server/doc'
import { logInteraction } from './Server/log'
import { cityInteraction } from './Server/city'
import { statsInteraction } from './Server/stats'
import { compeInteraction } from './Server/compe'
import { emoteInteraction } from './Server/emote'
import { delInteraction } from './Server/del'

export const interactions = {
  avatar: avatarInteraction,
  logo: logoInteraction,
  yt: ytInteraction,
  google: googleInteraction,
  color: colorInteraction,
  bananarap: bananarapInteraction,
  doc: docInteraction,
  log: logInteraction,
  city: cityInteraction,
  stats: statsInteraction,
  compe: compeInteraction,
  emote: emoteInteraction,
  del: delInteraction
}
