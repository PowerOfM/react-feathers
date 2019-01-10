import { createAction } from 'redux-actions'

function reduxifyUtil (app, actions, route, name) {
  const SERVICE_NAME = `${app.name}/services/${name.toUpperCase()}_`

  const service = app.service(route)
  if (!service) throw new Error(`Could not find service ${route}`)

  // Action types
  actions[name] = {
    find: createAction(`${SERVICE_NAME}FIND`, (params) => ({ promise: service.find(params) })),
    get: createAction(`${SERVICE_NAME}GET`, (id, params) => ({ promise: service.get(id, params) })),
    create: createAction(`${SERVICE_NAME}CREATE`, (data, params) => ({ promise: service.create(data, params) })),
    patch: createAction(`${SERVICE_NAME}PATCH`, (id, data, params) => ({ promise: service.patch(id, data, params) })),
    remove: createAction(`${SERVICE_NAME}REMOVE`, (id, params) => ({ promise: service.remove(id, params) }))
  }
}

/**
 * Creates redux bindings (action-creators and reducers) for each service
 * @param  {object} app           FeathersJS client instance
 * @param  {object} actions       Object wherein to store the service action-creators
 * @param  {object} routeNameMap  Object with the following format: { serviceName: 'api/service-url', ... }
 */
export default function reduxifyUtils (app, actions, routeNameMap) {
  let names = Object.keys(routeNameMap)
  for (let i = 0; i < names.length; i++) {
    reduxifyUtil(app, actions, routeNameMap[names[i]], names[i])
  }
}
