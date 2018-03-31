// @flow

import { createStore, applyMiddleware } from 'redux'
import logger from 'redux-logger'

import taskMiddleware from '../src/index'


export default () => createStore(
  (state = { posts: [] }, action) => {
    switch (action.type) {
      case 'POSTS_ADD':
        return {
          ...state,
          posts: action.payload || [],
        }

      case 'POSTS_INITIAL_LOAD':
        return {
          ...state,
          posts: action.payload || [],
        }

      default: {
        return state
      }
    }
  },
  applyMiddleware(taskMiddleware({ fetch, localStorage }), logger)
)
