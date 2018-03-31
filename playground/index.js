// @flow

import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import App from './App'
import { Provider } from 'react-redux'
import createStore from './create-store'
import { createGetLocalStorageTask } from './actions'


const store = createStore()
store.dispatch(createGetLocalStorageTask('initialState', {
  success: (initialState: string = '') => ({
    type: 'POSTS_INITIAL_LOAD',
    payload: JSON.parse(initialState),
  }),
  failure: () => ({ type: 'noop'})
}))

const rootEl = document.getElementById('root')
if (rootEl) {
  ReactDOM.render(<Provider store={store}><App /></Provider>, rootEl)
}
