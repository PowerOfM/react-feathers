import feathers from '@feathersjs/client'
import axios from 'axios'
import io from 'socket.io-client'

/**
 * Creates a FeathersJS client configured with either an Axois REST or socket.io connection.
 * @param  {string}  name       Name of this client
 * @param  {boolean} useSockets When true, use a socketio connection to the server.
 * @param  {string}  apiUrl     URL of the API server
 * @param  {object}  auth       Optional. Object with keys: path, service, and storageKey (all strings)
 * @return {object}  The new FeathersJS client instance
 */
export default function createClient (name, useSockets, apiUrl, auth) {
  const client = feathers()

  if (useSockets) {
    client.configure(feathers.socketio(io(apiUrl)))
  } else {
    client.configure(feathers.rest(apiUrl).axios(axios))
  }

  if (auth) {
    client.set('storage', window.localStorage)
    client.configure(feathers.authentication(auth))
  }

  client.name = name
  client.prefix = name ? name + '::' : ''
  return client
}
