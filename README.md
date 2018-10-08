# React Routing

> Simple page router for React with minimal dependencies

[![NPM](https://img.shields.io/npm/v/@ionx/react-routing.svg)](https://www.npmjs.com/package/@ionx/react-routing) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Install

```bash
npm install --save @ionx/react-routing
```

## Basic Usage

Simple usage without redux:

```jsx
import React from 'react'
import { render } from 'react-dom'
import { Router } from 'react-routing'

const Page1 = props => <h1>Page 1</h1>
const Page2 = props => <h1>Page 2</h1>

const App = (
  <Router routes={{
    '/uno': Page1,
    '/dos': Page2,
    '': '/uno' // Default handler redirects to /uno
  }} />
)

render(App, document.getElementById('root'))
```

It is recommended to use React-Routing with redux, in which case the LocationReducer should be registered with `createStore`, and the funcion `bindHistory(store)` should be called after the store is created.

For a complete example using Redux, see the `example` folder.

## License

MIT © [PowerOfM](https://github.com/PowerOfM)
