import { Dropbox } from 'dropbox'
import fetch from 'isomorphic-fetch'
import { DROPBOX_CLIENT_ID, DROPBOX_ACCESS_TOKEN } from './Config'

// Init the dropbox client
export const dropbox = new Dropbox({
  clientId: DROPBOX_CLIENT_ID,
  accessToken: DROPBOX_ACCESS_TOKEN,
  fetch
})
