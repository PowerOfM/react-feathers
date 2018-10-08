import { createAction, handleActions } from 'redux-actions'

const ID_FIELD = 'id'
const SORT_FUNCS = {
  'nameAsc': store => (a, b) => store[a].name.localeCompare(store[b].name),
  'nameDec': store => (a, b) => store[b].name.localeCompare(store[a].name),
  'rankAsc': store => (a, b) => Number(store[a].rank) - Number(store[b].rank),
  'rankDec': store => (a, b) => Number(store[b].rank) - Number(store[a].rank)
}

function createMethodReducer (name, type, idField) {
  const DEFAULT = {
    error: null,
    loading: false,
    result: null,
    current: null,
    store: {},
    keys: [],
    saved: 0
  }

  return {
    [`${name}_PENDING`]: (state = DEFAULT, action) => ({
      ...state,
      error: null,
      loading: true
    }),
    [`${name}_REJECTED`]: (state = DEFAULT, action) => ({
      ...state,
      error: action.payload,
      loading: false
    }),
    [`${name}_FULFILLED`]: (state = DEFAULT, action) => {
      let result = action.payload
      let ret = {
        ...state,
        error: null,
        loading: false,
        result: result
      }

      switch (type) {
        case 'find':
          ret.current = null
          ret.store = result.reduce((acc, val) => {
            if (!val[idField]) console.warn('Received object without valid idField')
            else acc[val[idField]] = val
            return acc
          }, {})
          break

        case 'get':
          ret.current = result
          ret.store[result[idField]] = result
          break

        case 'create':
        case 'patch':
          ret.current = result
          ret.saved = Date.now()
          ret.store[result[idField]] = result
          break

        case 'remove':
          ret.current = null
          delete ret.store[result[idField]]
          break

        default:
          throw new Error('Invalid method type ' + type)
      }
      ret.keys = Object.keys(ret.store)
      return ret
    }
  }
}

function reduxifyService (app, actions, reducers, route, name, idField, sortFunctions) {
  const SERVICE_NAME = `services/${name.toUpperCase()}_`

  const service = app.service(route)
  if (!service) throw new Error(`Could not find service ${route}`)

  // Action types
  const FIND = `${SERVICE_NAME}FIND`
  const GET = `${SERVICE_NAME}GET`
  const CREATE = `${SERVICE_NAME}CREATE`
  const PATCH = `${SERVICE_NAME}PATCH`
  const REMOVE = `${SERVICE_NAME}REMOVE`
  const RESET = `${SERVICE_NAME}RESET`
  const SET_CURRENT = `${SERVICE_NAME}SET_CURRENT`
  const SORT = `${SERVICE_NAME}SORT`

  actions[name] = {
    find: createAction(FIND, (params) => ({ promise: service.find(params) })),
    get: createAction(GET, (id, params) => ({ promise: service.get(id, params) })),
    create: createAction(CREATE, (data, params) => ({ promise: service.create(data, params) })),
    patch: createAction(PATCH, (id, data, params) => ({ promise: service.patch(id, data, params) })),
    remove: createAction(REMOVE, (id, params) => ({ promise: service.remove(id, params) })),
    setCurrent: createAction(SET_CURRENT),
    sort: createAction(SORT),
    reset: createAction(RESET)
  }

  reducers[name] = handleActions(Object.assign({},
    createMethodReducer(FIND, 'find', idField),
    createMethodReducer(GET, 'get', idField),
    createMethodReducer(CREATE, 'create', idField),
    createMethodReducer(PATCH, 'patch', idField),
    createMethodReducer(REMOVE, 'remove', idField),
    {
      [SET_CURRENT]: (state, action) => {
        if (state.loading) return state
        return {
          ...state,
          current: state.store[action.payload]
        }
      },
      [SORT]: (state, action) => {
        if (state.loading) return state
        let sortBy = action.payload
        if (typeof sortBy === 'string') sortBy = sortFunctions[sortBy]
        return {
          ...state,
          keys: [...state.keys].sort(sortBy(state.store))
        }
      },
      [RESET]: (state, action) => {
        if (state.loading) return state
        return {
          ...state,
          error: null,
          loading: false,
          result: null,
          current: null,
          store: {},
          keys: [],
          saved: 0
        }
      }
    }
  ), {
    error: null,
    loading: false,
    result: null,
    current: null,
    store: {},
    saved: 0,
    keys: []
  })
}

/**
 * Creates redux bindings (action-creators and reducers) for each service
 * @param  {object} app           FeathersJS client instance
 * @param  {object} actions       Object wherein to store the service action-creators
 * @param  {object} reducers      Object wherein to store the service reducers
 * @param  {object} routeNameMap  Object with the following format: { serviceName: 'api/service-url', ... }
 * @param  {string} idField       Field used for ids, default `id`.
 * @param  {object} sortFunctions Object with named sorting functions, eg: { 'nameAsc': store => (a, b) => store[a].name.localeCompare(store[b].name) }
 */
export default function reduxifyServices (app, actions, reducers, routeNameMap, idField = ID_FIELD, sortFunctions = SORT_FUNCS) {
  let names = Object.keys(routeNameMap)
  for (let i = 0; i < names.length; i++) {
    reduxifyService(app, actions, reducers, routeNameMap[names[i]], names[i], idField, sortFunctions)
  }
}
