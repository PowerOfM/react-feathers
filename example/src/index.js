import React from 'react'
import { render } from 'react-dom'
import { createStore, compose, applyMiddleware, combineReducers } from 'redux'
import { Provider, connect } from 'react-redux'
import ReactFeathers from '@ionx/react-feathers'
import App from './app'
import './index.css'

// Setup Feathers
const feathers = new ReactFeathers({
  apiUrl: 'http://localhost:9020',
  serviceNameMap: {
    suppliers: '/api/suppliers'
  }
})

// Logger
const logger = store => next => action => {
  console.info('>> ' + action.type, action.payload)
  return next(action)
}

// Create store
const store = createStore(
  combineReducers(feathers.getServiceReducers()),
  {},
  compose(applyMiddleware(...feathers.getMiddleware(), logger))
)

// Connect main page with redux
const ConnectedApp = connect(
  state => ({
    ...state
  }),
  dispatch => ({
    dispatch,
    services: feathers.getServices(store)
  })
)(App)

// Mount-point
const Root = (
  <Provider store={store}>
    <ConnectedApp />
  </Provider>
)
render(Root, document.getElementById('root'))
