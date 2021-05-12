import { promisify } from 'util'
import { ApplicationCommandOptionType } from "discord-api-types";
import { CommandInteraction } from "discord.js";
import { google } from "googleapis";
import { GOOGLE_APIKEY, GOOGLE_SEARCH_CX } from "../../lib/Config";
import { NEWLINE } from "../../lib/utils/GetNewline";

const googleClient = google.customsearch('v1')
const googleSearchAsync = promisify(googleClient.cse.list.bind(googleClient.cse))

export const googleInteraction = {
  version: 0,
  oldVersion: 0,

  interaction: {
    name: 'google',
    description: 'Cerca su Google',
    options: [{
      name: 'query',
      type: ApplicationCommandOptionType.STRING,
      description: 'Query di ricerca',
      required: true
    }]
  },

  handler: async (message: CommandInteraction) => {
    const input = message.options[0].value;

    const { data: { items } } = await googleSearchAsync({ q: input, auth: GOOGLE_APIKEY, cx: GOOGLE_SEARCH_CX })
    if (!items || !items.length) return message.reply(`Non ho trovato risultati per '${input}'`)
    const res = `Il primo risultato da Google per '${input}' ${NEWLINE + items[0].link}`
    await message.reply(res)
  }
}

