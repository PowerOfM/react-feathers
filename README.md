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

// Setup Feathers
ReactFeathers.setup({
  apiUrl: 'http://localhost:8080',
  serviceNameMap: {
    content: '/api/content'
  }
})

// Create store
const store = createStore(
  combineReducers(ReactFeathers.getServiceReducers()),
  {},
  compose(applyMiddleware(...ReactFeathers.getMiddleware()))
)

// Bind services to store's dispatch
ReactFeathers.bindServices(store)

// Our main page
const App = props => <div>Hello</div>

// Connect main page with redux
const ConnectedApp = connect(
  state => ({
    ...state
  }),
  dispatch => ({
    dispatch,
    services: ReactFeathers.getServices()
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

For a complete example, see the `example` folder.

## License

MIT © [PowerOfM](https://github.com/PowerOfM)
