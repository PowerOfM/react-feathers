import thunk from 'redux-thunk'
import promiseMiddleware from 'redux-promise-middleware'
import createClient from './create-client'
import reduxifyServices from './reduxify-services'
import reduxifyAuth from './reduxify-auth'
import bindServicesWithDispatch from './bind-services'

let client
let services
let serviceReducers
let serviceNames

export default {
  /**
   * Creates the FeathersJS client and configures auth and services
   * @param  {boolean}  options.useSockets      When true, a socket.io connection to the API server will be created
   * @param  {string}   options.apiUrl          URL to the API server
   * @param  {object}   options.serviceNameMap  Object with serviceName as the keys, and remote service-url as the values
   * @param  {object}   options.authConfig      Optional. Object with keys: path, service, and storageKey (all strings)
   * @param  {function} options.authInitalize   Optional. Function that runs after the user has authenticated. Takes in
   *                                            `data`, and should return it afterwards.
   * @param  {string}   options.idField         Optional. Field returned by server that has the `id` value. Default 'id'
   * @param  {object}   options.sortFunctions   Optional. Object with the name of a sort function as the key and a
   *                                            function that takes in the store and returns a valid sort function as
   *                                            the value. Ex: `store => (a, b) => store[a].name.localeCompare(store[b].name)`
   * @return {object}   An object with all serviceNames mapped to objects with their action creators.
   */
  setup: ({ useSockets, apiUrl, serviceNameMap, authConfig, authInitalize, idField, sortFunctions }) => {
    client = createClient(useSockets, apiUrl, authConfig)

    services = {}
    serviceReducers = {}
    serviceNames = Object.keys(serviceNameMap)
    reduxifyServices(client, services, serviceReducers, serviceNameMap, idField, sortFunctions)

    if (authConfig) {
      serviceNames.unshift('auth')
      reduxifyAuth(client, authInitalize, services, serviceReducers)
    }

    return services
  },

  /**
   * Bind all service action creators with the store's dispatch function
   * @param  {object} store Redux store
   */
  bindServices: (store) => {
    bindServicesWithDispatch(store.dispatch, services)
  },

  /**
   * Returns the FeathersJS client instance (after setup() has been called)
   */
  getClient: () => client,

  /**
   * Returns the services object, which has all their action-creators (after setup() has been called)
   */
  getServices: () => services,

  /**
   * Returns reducers for all services in a object where the keys are service names and the values are their reducers
   */
  getServiceReducers: () => serviceReducers,

  /**
   * Helper function for redux store. Returns an array with reduxThunk and reduxPromimseMiddleware, which are needed to
   * process the events from the services. If you are already using these two middleware libraries, you do not need to
   * use this function.
   */
  getMiddleware: () => ([ thunk, promiseMiddleware() ])
}
