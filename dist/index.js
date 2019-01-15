'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var feathers = _interopDefault(require('@feathersjs/client'));
var axios = _interopDefault(require('axios'));
var io = _interopDefault(require('socket.io-client'));
var reduxActions = require('redux-actions');
var redux = require('redux');
require('redux-promise-middleware');

/**
 * Creates a FeathersJS client configured with either an Axois REST or socket.io connection.
 * @param  {string}  name       Name of this client
 * @param  {boolean} useSockets When true, use a socketio connection to the server.
 * @param  {string}  apiUrl     URL of the API server
 * @param  {object}  auth       Optional. Object with keys: path, service, and storageKey (all strings)
 * @return {object}  The new FeathersJS client instance
 */
function createClient(name, useSockets, apiUrl, auth) {
  var client = feathers();

  if (useSockets) {
    client.configure(feathers.socketio(io(apiUrl)));
  } else {
    client.configure(feathers.rest(apiUrl).axios(axios));
  }

  if (auth) {
    client.set('storage', window.localStorage);
    client.configure(feathers.authentication(auth));
  }

  client.name = name;
  client.prefix = name ? name + '::' : '';
  return client;
}

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

var defineProperty = function (obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
};

var _extends = Object.assign || function (target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];

    for (var key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }

  return target;
};

var toConsumableArray = function (arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

    return arr2;
  } else {
    return Array.from(arr);
  }
};

var ID_FIELD = 'id';
var SORT_FUNCS = {
  'nameAsc': function nameAsc(store) {
    return function (a, b) {
      return store[a].name.localeCompare(store[b].name);
    };
  },
  'nameDec': function nameDec(store) {
    return function (a, b) {
      return store[b].name.localeCompare(store[a].name);
    };
  },
  'rankAsc': function rankAsc(store) {
    return function (a, b) {
      return Number(store[a].rank) - Number(store[b].rank);
    };
  },
  'rankDec': function rankDec(store) {
    return function (a, b) {
      return Number(store[b].rank) - Number(store[a].rank);
    };
  }
};

function createMethodReducer(name, type, idField) {
  var _ref;

  var DEFAULT = {
    error: null,
    loading: false,
    result: null,
    current: null,
    store: {},
    keys: [],
    saved: 0
  };

  return _ref = {}, defineProperty(_ref, name + '_PENDING', function undefined() {
    var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : DEFAULT;
    return _extends({}, state, {
      error: null,
      loading: true
    });
  }), defineProperty(_ref, name + '_REJECTED', function undefined() {
    var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : DEFAULT;
    var action = arguments[1];
    return _extends({}, state, {
      error: action.payload,
      loading: false
    });
  }), defineProperty(_ref, name + '_FULFILLED', function undefined() {
    var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : DEFAULT;
    var action = arguments[1];

    var result = action.payload;
    var ret = _extends({}, state, {
      error: null,
      loading: false,
      result: result
    });

    switch (type) {
      case 'find':
        ret.current = null;
        if (result && Array.isArray(result)) {
          ret.store = result.reduce(function (acc, val) {
            if (!val[idField]) console.warn('Received object without valid idField');else acc[val[idField]] = val;
            return acc;
          }, {});
        } else {
          ret.store = {};
        }
        break;

      case 'get':
        ret.current = result;
        ret.store[result[idField]] = result;
        break;

      case 'create':
      case 'patch':
        ret.current = result;
        ret.saved = Date.now();
        ret.store[result[idField]] = result;
        break;

      case 'remove':
        ret.current = null;
        delete ret.store[result[idField]];
        break;

      default:
        throw new Error('Invalid method type ' + type);
    }
    ret.keys = Object.keys(ret.store);
    return ret;
  }), _ref;
}

function reduxifyService(app, actions, reducers, route, name, idField, sortFunctions) {
  var _Object$assign;

  var serviceName = app.prefix + 'services::' + name.toUpperCase() + '_';

  var service = app.service(route);
  if (!service) throw new Error('Could not find service ' + route);

  // Action types
  var FIND = serviceName + 'FIND';
  var GET = serviceName + 'GET';
  var CREATE = serviceName + 'CREATE';
  var PATCH = serviceName + 'PATCH';
  var REMOVE = serviceName + 'REMOVE';
  var RESET = serviceName + 'RESET';
  var SET_CURRENT = serviceName + 'SET_CURRENT';
  var SORT = serviceName + 'SORT';

  actions[name] = {
    find: reduxActions.createAction(FIND, function (params) {
      return { promise: service.find(params) };
    }),
    get: reduxActions.createAction(GET, function (id, params) {
      return { promise: service.get(id, params) };
    }),
    create: reduxActions.createAction(CREATE, function (data, params) {
      return { promise: service.create(data, params) };
    }),
    patch: reduxActions.createAction(PATCH, function (id, data, params) {
      return { promise: service.patch(id, data, params) };
    }),
    remove: reduxActions.createAction(REMOVE, function (id, params) {
      return { promise: service.remove(id, params) };
    }),
    setCurrent: reduxActions.createAction(SET_CURRENT),
    sort: reduxActions.createAction(SORT),
    reset: reduxActions.createAction(RESET)
  };

  reducers[name] = reduxActions.handleActions(Object.assign({}, createMethodReducer(FIND, 'find', idField), createMethodReducer(GET, 'get', idField), createMethodReducer(CREATE, 'create', idField), createMethodReducer(PATCH, 'patch', idField), createMethodReducer(REMOVE, 'remove', idField), (_Object$assign = {}, defineProperty(_Object$assign, SET_CURRENT, function (state, action) {
    if (state.loading) return state;
    return _extends({}, state, {
      current: state.store[action.payload]
    });
  }), defineProperty(_Object$assign, SORT, function (state, action) {
    if (state.loading) return state;
    var sortBy = action.payload;
    if (typeof sortBy === 'string') sortBy = sortFunctions[sortBy];
    return _extends({}, state, {
      keys: [].concat(toConsumableArray(state.keys)).sort(sortBy(state.store))
    });
  }), defineProperty(_Object$assign, RESET, function (state, action) {
    if (state.loading) return state;
    return _extends({}, state, {
      error: null,
      loading: false,
      result: null,
      current: null,
      store: {},
      keys: [],
      saved: 0
    });
  }), _Object$assign)), {
    error: null,
    loading: false,
    result: null,
    current: null,
    store: {},
    saved: 0,
    keys: []
  });
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
function reduxifyServices(app, actions, reducers, routeNameMap) {
  var idField = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : ID_FIELD;
  var sortFunctions = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : SORT_FUNCS;

  var names = Object.keys(routeNameMap);
  for (var i = 0; i < names.length; i++) {
    reduxifyService(app, actions, reducers, routeNameMap[names[i]], names[i], idField, sortFunctions);
  }
}

/**
 * Creates Redux bindings (reducers and actions) for the FeathersJS authentication service
 * @param {object}    app            FeathersJS client instance
 * @param {object}    actions        Object wherein to store the service action-creators
 * @param {object}    reducers       Object wherein to store the service reducers
 * @param {object}    authConfig     Optional. Object with keys: path, service, and storageKey (all strings)
 * @param {function}  authInitialize Optional. Function that runs after the user has authenticated.
 *                                   Takes in `data`, and should return it afterwards.
 */
function reduxifyAuth(app, actions, reducers, authConfig) {
  var _handleActions;

  var authInitialize = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : function (data) {
    return data;
  };

  // ACTION TYPES
  var AUTHENTICATE = app.prefix + 'auth::AUTHENTICATE';
  var LOGOUT = app.prefix + 'auth::LOGOUT';
  var UPDATE_USER = app.prefix + 'auth::UPDATE_USER';

  // ACTION CREATORS
  actions[authConfig.name] = {
    // Note: action.payload in reducer will have the value of .data below
    authenticate: reduxActions.createAction(AUTHENTICATE, function (p) {
      return {
        promise: app.authenticate(p).then(authInitialize, actions),
        data: undefined
      };
    }),
    logout: reduxActions.createAction(LOGOUT),
    updateUser: reduxActions.createAction(UPDATE_USER),
    checkJWT: function checkJWT(jwt) {
      // Try to fetch from local storage
      if (!jwt) {
        jwt = app.get('storage').getItem(authConfig.storageKey || 'feathers-jwt');
      }

      if (!jwt) return false;

      return actions.auth.authenticate({ strategy: 'jwt', jwt: jwt });
    }

    // REDUCER
  };reducers[authConfig.name] = reduxActions.handleActions((_handleActions = {}, defineProperty(_handleActions, AUTHENTICATE + '_PENDING', function undefined(state, action) {
    return _extends({}, state, {
      errors: null,
      loading: true,
      valid: false,
      admin: false,
      user: null,
      token: null,
      ignorePendingAuth: false
    });
  }), defineProperty(_handleActions, AUTHENTICATE + '_FULFILLED', function undefined(state, action) {
    var user = action.payload.user;

    if (state.ignorePendingAuth) {
      // A logout was dispatched between the authentication being started and completed
      app.logout();

      return _extends({}, state, {
        errors: null,
        loading: false,
        valid: false,
        admin: false,
        data: null,
        token: null,
        ignorePendingAuth: false
      });
    }

    return _extends({}, state, {
      errors: null,
      loading: false,
      valid: true,
      admin: user.admin || false,
      user: user,
      token: action.payloadtoken,
      ignorePendingAuth: false
    });
  }), defineProperty(_handleActions, AUTHENTICATE + '_REJECTED', function undefined(state, action) {
    return _extends({}, state, {
      // action.payload = { name: "NotFound", message: "No record found for id 'G6HJ45'",
      //   code:404, className: "not-found" }
      errors: action.payload,
      loading: false,
      valid: false,
      admin: false,
      user: null,
      token: null,
      ignorePendingAuth: false
    });
  }), defineProperty(_handleActions, LOGOUT, function (state, action) {
    app.logout();

    return _extends({}, state, {
      errors: null,
      loading: null,
      valid: false,
      admin: false,
      user: null,
      token: null,
      // Ignore the result if an authentication has been started
      ignorePendingAuth: state.isLoading
    });
  }), defineProperty(_handleActions, UPDATE_USER, function (state, action) {
    var user = action.payload.user;
    return _extends({}, state, {
      admin: user.admin,
      user: user
    });
  }), _handleActions), {
    errors: null,
    loading: false,
    valid: false,
    admin: false,
    user: null,
    ignorePendingAuth: false
  });
}

function reduxifyUtil(app, actions, route, name) {
  var SERVICE_NAME = app.prefix + 'services::' + name.toUpperCase() + '_';

  var service = app.service(route);
  if (!service) throw new Error('Could not find service ' + route);

  // Action types
  actions[name] = {
    find: reduxActions.createAction(SERVICE_NAME + 'FIND', function (params) {
      return { promise: service.find(params) };
    }),
    get: reduxActions.createAction(SERVICE_NAME + 'GET', function (id, params) {
      return { promise: service.get(id, params) };
    }),
    create: reduxActions.createAction(SERVICE_NAME + 'CREATE', function (data, params) {
      return { promise: service.create(data, params) };
    }),
    patch: reduxActions.createAction(SERVICE_NAME + 'PATCH', function (id, data, params) {
      return { promise: service.patch(id, data, params) };
    }),
    remove: reduxActions.createAction(SERVICE_NAME + 'REMOVE', function (id, params) {
      return { promise: service.remove(id, params) };
    })
  };
}

/**
 * Creates redux bindings (action-creators and reducers) for each service
 * @param  {object} app           FeathersJS client instance
 * @param  {object} actions       Object wherein to store the service action-creators
 * @param  {object} routeNameMap  Object with the following format: { serviceName: 'api/service-url', ... }
 */
function reduxifyUtils(app, actions, routeNameMap) {
  var names = Object.keys(routeNameMap);
  for (var i = 0; i < names.length; i++) {
    reduxifyUtil(app, actions, routeNameMap[names[i]], names[i]);
  }
}

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
function bindServicesWithDispatch (dispatch, services, targetActions) {
  targetActions = targetActions || [
  // default targets from feathers-redux
  'find', 'get', 'create', 'patch', 'remove', 'reset', 'setCurrent', 'sort',
  // couple more optional ones in case feathers-reduxify-authentication is being used
  'authenticate', 'logout'];

  var serviceNames = Object.keys(services);
  // map over the services object to get every service
  serviceNames.forEach(function (name) {
    var methodNames = Object.keys(services[name]);

    // map over every method in the service
    methodNames.forEach(function (method) {
      // if method is in targeted actions then replace it with bounded method
      if (targetActions.indexOf(method) >= 0) {
        services[name][method] = redux.bindActionCreators(services[name][method], dispatch);
      }
    });
  });

  return services;
}

var ReactFeathers = function () {
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
  function ReactFeathers(_ref) {
    var name = _ref.name,
        useSockets = _ref.useSockets,
        apiUrl = _ref.apiUrl,
        serviceNameMap = _ref.serviceNameMap,
        utilNameMap = _ref.utilNameMap,
        authConfig = _ref.authConfig,
        authInitialize = _ref.authInitialize,
        idField = _ref.idField,
        sortFunctions = _ref.sortFunctions;
    classCallCheck(this, ReactFeathers);

    this.name = name || '';
    this.client = createClient(this.name, useSockets, apiUrl, authConfig);

    this.services = {};
    this.serviceReducers = {};
    this.serviceNames = Object.keys(serviceNameMap);
    reduxifyServices(this.client, this.services, this.serviceReducers, serviceNameMap, idField, sortFunctions);

    if (utilNameMap) {
      this.serviceNames.push(Object.keys(utilNameMap));
      reduxifyUtils(this.client, this.services, utilNameMap);
    }

    if (authConfig) {
      authConfig.name = authConfig.name || 'auth';
      this.serviceNames.unshift(authConfig.name);
      reduxifyAuth(this.client, this.services, this.serviceReducers, authConfig, authInitialize);
    }
  }

  /**
   * If the services have not been bound with the store's dispatch function,
   * they are bound.
   * @param  {object} store Redux store
   */


  createClass(ReactFeathers, [{
    key: 'bindServices',
    value: function bindServices(store) {
      if (!this.servicesBound) {
        bindServicesWithDispatch(store.dispatch, this.services);
        this.servicesBound = true;
      }
    }
  }]);
  return ReactFeathers;
}();

module.exports = ReactFeathers;
//# sourceMappingURL=index.js.map
