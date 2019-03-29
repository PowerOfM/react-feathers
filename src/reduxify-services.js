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
    loadingType: null,
    result: null,
    currentKey: null,
    current: null,
    store: {},
    keys: [],
    saved: 0
  }

  return {
    [`${name}_PENDING`]: (state = DEFAULT, action) => ({
      ...state,
      error: null,
      loading: true,
      loadingType: type
    }),
    [`${name}_REJECTED`]: (state = DEFAULT, action) => ({
      ...state,
      error: action.payload,
      loading: false,
      loadingType: null
    }),
    [`${name}_FULFILLED`]: (state = DEFAULT, action) => {
      let result = action.payload
      let ret = {
        ...state,
        error: null,
        loading: false,
        loadingType: null,
        result: result
      }

      // TODO: handle case when result is actually null

      switch (type) {
        case 'find':
          ret.current = null
          if (result && Array.isArray(result)) {
            ret.store = result.reduce((acc, val) => {
              if (!val[idField]) console.warn('Received object without valid idField')
              else acc[val[idField]] = val
              return acc
            }, {})
          } else {
            ret.store = {}
          }
          break

        case 'get':
          ret.current = result
          ret.currentKey = result[idField]
          ret.store[result[idField]] = result
          break

        case 'create':
        case 'patch':
          ret.current = result
          ret.currentKey = result[idField]
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
  const serviceName = `${app.prefix}services::${name.toUpperCase()}_`

  const service = app.service(route)
  if (!service) throw new Error(`Could not find service ${route}`)

  // Action types
  const FIND = serviceName + 'FIND'
  const GET = serviceName + 'GET'
  const CREATE = serviceName + 'CREATE'
  const PATCH = serviceName + 'PATCH'
  const REMOVE = serviceName + 'REMOVE'
  const RESET = serviceName + 'RESET'
  const SET_CURRENT = serviceName + 'SET_CURRENT'
  const SORT = serviceName + 'SORT'

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
        // if (state.loading) return state
        return {
          ...state,
          currentKey: action.payload,
          current: state.store[action.payload]
        }
      },
      [SORT]: (state, action) => {
        // if (state.loading) return state
        let sortBy = action.payload
        if (typeof sortBy === 'string') sortBy = sortFunctions[sortBy]
        return {
          ...state,
          keys: [...state.keys].sort(sortBy(state.store))
        }
      },
      [RESET]: (state, action) => {
        // if (state.loading) return state
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
