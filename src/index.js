import createClient from './create-client'
import reduxifyServices from './reduxify-services'
import reduxifyAuth from './reduxify-auth'
import reduxifyUtils from './reduxify-utils'
import bindServicesWithDispatch from './bind-services'

export default class ReactFeathers {
  /**
   * Creates the FeathersJS client and configures auth and services
   * @param  {boolean}  options.name            Specify a name for this feathers connection (defaults to '').
   * @param  {boolean}  options.useSockets      When true, a socket.io connection to the API server will be created
   * @param  {string}   options.apiUrl          URL to the API server
   * @param  {object}   options.serviceNameMap  Object with serviceName as the keys, and remote service-url as the values
   * @param  {object}   options.utilNameMap     Object with utilName as the keys, and remote util-url as the values.
   *                                            Utils are defined as services that have no store (local cache)
   * @param  {object}   options.authConfig      Optional. Object with keys: path, service, and storageKey (all strings)
   * @param  {function} options.authInitialize  Optional. Function that runs after the user has authenticated. Takes in
   *                                            `data`, and should return it afterwards.
   * @param  {string}   options.idField         Optional. Field returned by server that has the `id` value. Default 'id'
   * @param  {object}   options.sortFunctions   Optional. Object with the name of a sort function as the key and a
   *                                            function that takes in the store and returns a valid sort function as
   *                                            the value. Ex: `store => (a, b) => store[a].name.localeCompare(store[b].name)`
   * @return {object}   An object with all serviceNames mapped to objects with their action creators.
   */
  constructor ({ name, useSockets, apiUrl, serviceNameMap, utilNameMap, authConfig, authInitialize, idField, sortFunctions }) {
    this.name = name || ''
    this.client = createClient(this.name, useSockets, apiUrl, authConfig)

    this.services = {}
    this.serviceReducers = {}
    this.serviceNames = Object.keys(serviceNameMap)
    reduxifyServices(this.client, this.services, this.serviceReducers, serviceNameMap, idField, sortFunctions)

    if (utilNameMap) {
      this.serviceNames.push(Object.keys(utilNameMap))
      reduxifyUtils(this.client, this.services, utilNameMap)
    }

    if (authConfig) {
      authConfig.name = authConfig.name || 'auth'
      this.serviceNames.unshift(authConfig.name)
      reduxifyAuth(this.client, this.services, this.serviceReducers, authConfig, authInitialize)
    }
  }

  /**
   * If the services have not been bound with the store's dispatch function,
   * they are bound.
   * @param  {object} store Redux store
   */
  bindServices (store) {
    if (!this.servicesBound) {
      bindServicesWithDispatch(store.dispatch, this.services)
      this.servicesBound = true
    }
  }
}
