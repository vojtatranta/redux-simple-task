import events from 'events'

import {
  createFetchTask,
  createSetLocalStorageTask,
  FetchTask,
} from './actions'

const { describe, expect, it } = global


describe('Actions', () => {
  describe('FetchTask', () => {
    it('should create a FetchTask instance', () => {
      const task = createFetchTask('http://test.cz/', {
        success: () => ({ type: 'noop' }),
        failure: () => ({ type: 'noop' }),
      })

      expect(task).toBeInstanceOf(FetchTask)
    })


    it('should perform a fetch request when task is performed', () => {
      const task = createFetchTask('http://test.cz/', {
        success: () => ({ type: 'noop' }),
        failure: () => ({ type: 'noop' }),
      })

      const mockFetch = jest.fn().mockImplementation(() => Promise.resolve({ json: () => Promise.resolve({}) }))
      task.perform({ fetch: mockFetch }, jest.fn(), jest.fn())
      expect(mockFetch).toHaveBeenCalledWith('http://test.cz/')
    })


    it('should dispatch a POSTS_ADD action when fetch response is received', (callback) => {
      const task = createFetchTask('http://test.cz/', {
        success: (result) => ({ type: 'POSTS_ADD', payload: result }),
        failure: () => ({ type: 'noop' }),
      })
      const mockResult = [ { id: 1, title: 'Test title', body: 'Test body.' } ]

      const dispatchEmitter = new events.EventEmitter()
      dispatchEmitter.on('dispatch', (action) => {
        expect(action).toEqual({
          type: 'POSTS_ADD',
          payload: mockResult,
        })
        callback()
      })

      const mockDispatch = (action) => dispatchEmitter.emit('dispatch', action)
      const mockFetch = jest.fn().mockImplementation(() => Promise.resolve({ json: () => Promise.resolve(mockResult) }))
      task.perform({ fetch: mockFetch }, mockDispatch, jest.fn())
    })


    it('should dispatch a FETCH_FAILURE action when fetch request fails', (callback) => {
      const task = createFetchTask('http://test.cz/', {
        success: (result) => ({ type: 'POSTS_ADD', payload: result }),
        failure: (error) => ({ type: 'FETCH_FAILURE', payload: error.message }),
      })

      const dispatchEmitter = new events.EventEmitter()
      dispatchEmitter.on('dispatch', (action) => {
        expect(action).toEqual({
          type: 'FETCH_FAILURE',
          payload: 'Test error message!',
        })
        callback()
      })

      const mockDispatch = (action) => dispatchEmitter.emit('dispatch', action)
      const error = new Error('Test error message!')
      const mockFetch = jest.fn().mockImplementation(() => Promise.reject(error))
      task.perform({ fetch: mockFetch }, mockDispatch, jest.fn())
    })
  })


  describe('LocalStorageTask', () => {
    it('should dispatch a STORAGE_SUCCESS action when local storage item is successfully set', () => {
      const task = createSetLocalStorageTask('testKey', 'testValue', {
        success: (result) => ({ type: 'STORAGE_SUCCESS', payload: result }),
        failure: () => ({ type: 'noop' }),
      })

      const mockLocalStorage = {
        setItem: jest.fn(),
      }
      task.perform({ localStorage: mockLocalStorage }, jest.fn(), jest.fn())
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('testKey', 'testValue')
    })
  })
})
