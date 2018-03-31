// @flow

import { Task } from '../src/index'

import type { Action } from '../src/index'


type TestState = {
  name: string,
}

type fetchType = typeof fetch
type localStorageType = typeof localStorage
type ExtendedAction = Action<$Subtype<Task<TestState, (ExtendedAction) => void>>>
type GetState = () => TestState

export class FetchTask extends Task<{ fetch: fetchType }, TestState, (ExtendedAction) => void> {
  _url: string

  constructor(url: string, handlers: *) {
    super(handlers)
    this._url = url
  }

  perform({ fetch }: { fetch: fetchType }, dispatch: (ExtendedAction) => void, getState: GetState) {
    fetch(this._url)
      .then(
        res => res.json().then((res: {}) => {
          dispatch(this._success(res, getState()))
        }),
        err => dispatch(this._failure(err, getState()))
      )
  }
}

export class GetLocalStorageTask extends Task<{ localStorage: localStorageType }, TestState, (ExtendedAction) => void> {
  _localStorageKey: string

  constructor(localStorageKey: string, handlers: *) {
    super(handlers)
    this._localStorageKey = localStorageKey
  }

  perform(
    { localStorage }: { localStorage: localStorageType },
    dispatch: (ExtendedAction) => void,
    getState: GetState
  ) {
    try {
      const value = localStorage.getItem(this._localStorageKey)
      dispatch(this._success(value, getState()))
    } catch (err) {
      dispatch(this._failure(err, getState()))
    }
  }
}

export class SetLocalStorageTask extends Task<{ localStorage: localStorageType }, TestState, (ExtendedAction) => void> {
  _localStorageValue: string
  _localStorageKey: string

  constructor(localStorageKey: string, localStorageValue: string, handlers: *) {
    super(handlers)
    this._localStorageKey = localStorageKey
    this._localStorageValue = localStorageValue
  }

  perform(
    { localStorage }: { localStorage: localStorageType },
    dispatch: (ExtendedAction) => void,
    getState: GetState
  ) {
    try {
      const result = localStorage.setItem(
        this._localStorageKey,
        this._localStorageValue
      )
      dispatch(this._success(result, getState()))
    } catch (err) {
      dispatch(this._failure(err, getState()))
    }
  }
}

export const createGetLocalStorageTask = (storageKey: string, handlers: *) => {
  return new GetLocalStorageTask(storageKey, handlers)
}

export const createSetLocalStorageTask = (
  storageValue: string,
  storageKey: string,
  handlers: *
) => {
  return new SetLocalStorageTask(storageValue, storageKey, handlers)
}

export const createFetchTask = (url: *, handlers: *) => {
  return new FetchTask(url, handlers)
}

