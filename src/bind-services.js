import { bindActionCreators } from 'redux'

/**
 * Method to bind a given dispatch function with the passed services.
 *
 * This helps with not having to pass down store.dispatch as a prop everywhere
 * Read More: http://redux.js.org/docs/api/bindActionCreators.html
 *
 * @param  {object}   services        Using the default reduxifyService method
 * @param  {function} dispatch        The relevant store.dispatch function which is to be bounded to actionCreators
 * @param  {array}    targetActions   List of action names to be targeted for binding
 * @return {object}                   Returns the new services object with the bounded action creators
 */
export default function (dispatch, services, targetActions) {
  targetActions = targetActions || [
    // default targets from feathers-redux
    'find',
    'get',
    'create',
    'patch',
    'remove',
    'reset',
    'setCurrent',
    'sort',
    // couple more optional ones in case feathers-reduxify-authentication is being used
    'authenticate',
    'logout',
    'checkJWT'
  ]

  const serviceNames = Object.keys(services)
  // map over the services object to get every service
  serviceNames.forEach(name => {
    const methodNames = Object.keys(services[name])

    // map over every method in the service
    methodNames.forEach(method => {
      // if method is in targeted actions then replace it with bounded method
      if (targetActions.indexOf(method) >= 0) {
        services[name][method] = bindActionCreators(
          services[name][method],
          dispatch
        )
      }
    })
  })

  return services
}
