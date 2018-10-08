import React from 'react'
import { render } from 'react-dom'
import { createStore, compose, applyMiddleware, combineReducers } from 'redux'
import { Provider, connect } from 'react-redux'
import ReactFeathers from '@ionx/react-feathers'
import App from './app'
import './index.css'

// Setup Feathers
ReactFeathers.setup({
  apiUrl: 'http://localhost:9020',
  serviceNameMap: {
    suppliers: '/api/suppliers'
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
