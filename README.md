# React Feathers

> Simplified FeathersJS configuration for React apps

[![NPM](https://img.shields.io/npm/v/@ionx/react-feathers.svg)](https://www.npmjs.com/package/@ionx/react-feathers) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Install

```bash
npm install --save @ionx/react-feathers
```

## Basic Usage

```jsx
import React from 'react'
import { render } from 'react-dom'
import { createStore, compose, applyMiddleware, combineReducers } from 'redux'
import { Provider, connect } from 'react-redux'
import ReactFeathers from '@ionx/react-feathers'

// STEP 1: Setup Feathers
ReactFeathers.setup({
  apiUrl: 'http://localhost:8080',
  serviceNameMap: {
    content: '/api/content'
  }
})

// STEP 2: Create store, and include ReactFeathers' serviceReducers and middleware
const store = createStore(
  combineReducers(ReactFeathers.getServiceReducers()),
  {},
  compose(applyMiddleware(...ReactFeathers.getMiddleware()))
)

// Our main page
const App = props => <div>Hello World</div>

// STEP 3: Connect main page with redux, and include ReactFeathers' services in dispatch
const ConnectedApp = connect(
  state => ({
    ...state
  }),
  dispatch => ({
    dispatch,
    services: ReactFeathers.getServices(store)
  })
)(App)

// Mount-point
const Root = (
  <Provider store={store}>
    <ConnectedApp />
  </Provider>
)

render(Root, document.getElementById('root'))
```

For a working example, see the `example` folder.

## API
### `setup(options)`
Initial setup function that must be called before using any other function in this library.

##### Options
- **`useSockets`** (_Boolean_): When true, the Feathers client will be initialized with a socket.io connection. If false (or omitted), the Feathers client will be initialized using a REST connection via Axios.
- **`apiUrl`** (_String_): URL of the API server running FeathersJS. This url should generally not end with a `/`, and all service urls should start with a `/`. You can reverse this pattern, but remember to stay consistent.
- **`serviceNameMap`** (_Object_): Object with service names as the keys, and service urls as the values. The keys of this object will be used as the names for the redux-store keys and action-creator groups (i.e. `services.users.find()`). Example:
    ```
    {
      users: '/api/users',
      news: '/api/news'
    }
    ```
- **`authConfig`** (_Object_) _OPTIONAL_: Configuration for authentication. For more information see the [FeathersJS Authentication Client docs](https://docs.feathersjs.com/api/authentication/client.html#options). This object should have at least the following keys:
  + `path`: service url for the authentication service, ex: `api/auth`
  + `service`: service url for the users service, ex: `api/users`
  + `storage`: a WebStorage-compatible object to enable automatic storage on the client, ex: `window.localStorage`
  + `storageKey`: service url for the users service, ex: `myapp-jwt`
- **`authInitialize`** (_Function_) _OPTIONAL_: Function that runs after the user has authenticated. Takes in `data`, and should return it after all operations have compete, such as after a promise resolves.
- **`idField`** (_String_) _OPTIONAL_: Field returned by server that has the `id` value. Default: `id`.
- **`sortFunctions`** (_Object_) _OPTIONAL_: Custom sorting functions stored by name in an object. These functions should take in the service-store and return a valid sort function. Example:
    ```
    {
      nameAsc: store => (a, b) => store[a].name.localeCompare(store[b].name),
      rankDec: store => (a, b) => Number(store[b].rank) - Number(store[a].rank)
    }
    ```

### `getClient()`
Returns the FeathersJS client instance (only usable after `setup()` has been called).

### `getServices(reduxStore)`
Returns the services object, which has all their action-creators (after setup() has been called). If the store param is passed and the services have not been bound with the Redux store's dispatch function, the binding takes place.

### `getServiceReducers()`
Returns reducers for all services in a object where the keys are service names and the values are their reducers.

### `getMiddleware()`
Helper function for redux store. Returns an array with reduxThunk and reduxPromimseMiddleware, which are needed to process the events from the services. If you are already using these two middleware libraries, you do not need to use this function.


## Service States
Following the basic example, the redux-states for each service will be under `props[serviceName]`, where `serviceName` is one of the names defined in the `serviceNameMap`. Each one will have the following structure:
- `error`: When a remote error occurs, the error is set here. Otherwise, it is null,
- `loading`: True when a remote action for this service is pending
- `result`: The outcome of the latest `find`, `get`, `patch` or `remove` request.
- `current`: The last value returned by a `get` request, or set manually with the `setCurrent` method.
- `store`: An object where all keys are ids and the values are the corresponding data
- `keys`: An array of all ids (directly corresponding to the `store`'s keys).
- `saved`: UNIX Timestamp in milliseconds of the last time a `create` or `patch` request was made.

## Service Methods
If you setup ReactFeathers following the basic example, all action-creators will be listed under `props.services[serviceName]`, where `serviceName` is one of the names defined in the `serviceNameMap`. The methods for each service are:
- `find(params)`: Sends FIND request  to the server. When fullfilled, clears the state's `store`, saves the result to the state's `result`, and updates the state's `store` and `keys` with the results.
- `get(id, params)`: Sends GET request to the server. When fullfilled, saves result to state's `result` and `current`, and adds the data to state's `store`.
- `create(data, params)`: Sends CREATE request to the server. When fullfilled, saves result to state's `result` and `current`, and add the data to state's `store`. Also updates the state's `saved` timestamp to the current time.
- `patch(id, data, params)`: Sends PATCH request to the server.  When fullfilled, saves result to state's `result` and `current`, and updates the data in the state's `store`. Also updates the state's `saved` timestamp to the current time.
- `remove(id, params)`: Sends REMOVE request to the server. Sets `current` to null, and deletes the data from the state's `store`.
- `reset()`: Resets the state to the original values:
    ```
    {
      error: null,
      loading: false,
      result: null,
      current: null,
      store: {},
      keys: [],
      saved: 0
    }
    ```
- `setCurrent(id)`: Sets the state's `current` to `store[id]`,
- `sort(sortFunctionName || sortFunction)`: Sorts the state's `keys` array according to the sort function. You can use a sort function defined by `setup()`, or pass a custom sort function. The function signature should be: `stateStore => (a, b) => { ... }`. For example, ascending sorting of the IDs based on their object's names:
  ```
  store => (a, b) => store[a].name.localeCompare(store[b].name)
  ```

## License

MIT © [PowerOfM](https://github.com/PowerOfM)
