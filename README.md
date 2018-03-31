# Redux simple task
Finally a redux library for handling asynchronous code in testable way!

Inspired by Elm's task... As whole Redux :)

## Motivation
Redux thunk is kinda OK, it's simple, yet you can do with it everything. However, it enforces callback hell in you code.

Sagas or redux-rx are just waaaay to complicated for most usecases.

But there's a bigger problem which bothers me a lot and thats **testability**.

If you just pasted this example with redux-thunk and try to test it, you'd fail miserably:
```js
const asyncFetchAction = url => dispatch => fetch(url)
  .then(res => res.json())
  .then(actualResult => dispatch({
    type: 'RECEIVE_FETCH_RESULT',
    payload: actualResult,
  }))
```
Alright, what's wrong with this? I can test it easily! - You might say.

But wait, how would you test `fetch()`? You'd have to wrap somehow Javascript's core function? If you like this idea, maybe you should try mostly untestable Python code :) Where monkeypatching is just as common as extending class with 3+ parents...

So, how to fix it?

## Dependency injection!
```js
let asyncFetchAction = createInjectedFunction(url => services => dispatch => {
  services.fetch(url)
    .then(res => res.json())
    .then(actualResult => {
      dispatch({
        type: 'RECEIVE_FETCH_RESULT',
        payload: actualResult,
      })
    })
}, {
  fetch: jest.fn().mockImplementation(() => Promise.resolve({}))
})
```
Yes, you don't probably understand this code, but it is similar to Angular's dependency injection schema:
```js
import { Component }   from '@angular/core';
import { Hero }        from './hero';
import { HeroService } from './hero.service';

@Component({
  selector: 'app-hero-list',
  template: `
    <div *ngFor="let hero of heroes">
      {{hero.id}} - {{hero.name}}
    </div>
  `
})
export class HeroListComponent {
  heroes: Hero[];

  constructor(heroService: HeroService) {
    this.heroes = heroService.getHeroes();
  }
}
```
There's some magic going on and magically you get a `heroService` of type `HeroService` to the contructor from some `DI container`.
Well, that's at least awkward when we think in functions, right?

Wy could do the same, but there must be some kind of redux middleware to handle `fetch` service injection, but that's not probably what we really want.

I would rather do this:
```js
const createFetchTask = (url, handlers) => new FetchTask(url, handlers)

export const asyncFetchAction = (url, success) => createFetchTask(url, { success, failure: () => ({ type: 'noop' }) })
```
Does it not look sexy? I think so!

You don't probably understand, what does it do, so there's an explanation:

`FetchTask` is a simple class that describes what should be done, you pass it just url which should be fetched and success and failure callbacks.

So you don't really need `fetch` function in the action itself, you need it just in the `FetchTask` implementation, which is something like this:
```js
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
```
Don't worry about `Flow type`. The magic is happening in the `perform()` method. This is the place where Dependency injection comes to play. And where you get the `fetch` implementation?

Well, just create a Redux middleware!
```js

export const taskMiddleware = services => store => next => action => {
  if (action instanceof Task) {
    action.perform(services, store.dispatch, store.getState)
    return
  }

  let result = next(action)
  return result
}

// create a store
export default () => createStore(
  (state = { posts: [] }, action) => {
    switch (action.type) {
      case 'POSTS_ADD':
        return {
          ...state,
          posts: action.payload || [],
        }

      default: {
        return state
      }
    }
  },
  applyMiddleware(taskMiddleware({ fetch: fetch }))
)
```
Woohooo! Isn't it great?

Now, take a look at tests of our new action creator!
```js
  it('should perform a fetch request when task is performed', () => {
    const task = asyncFetchAction('http://test.cz/', () => ({ type: 'noop' }))

    const mockFetch = jest.fn().mockImplementation(() => Promise.resolve({
      json: () => Promise.resolve({})
    }))
    task.perform(
      { fetch: mockFetch },
      jest.fn(),
      jest.fn()
    )
    expect(mockFetch).toHaveBeenCalledWith('http://test.cz/')
  })
```
That's it. No monkey patching, just pure code! This is achieved by abstracting of actual asynchronous work to the Task object, which just describes what should be done, let's take a look how would be implement a task which abstracts Local storage. Why do I want to abstract Local storage? Because it's a side effect which are hard to test (mostly, they are global variables).
```js
export class SetLocalStorageTask extends Task {
  _localStorageValue
  _localStorageKey

  constructor(
    localStorageKey,
    localStorageValue,
    handlers
  ) {
    super(handlers)
    this._localStorageKey = localStorageKey
    this._localStorageValue = localStorageValue
  }

  perform(
    { localStorage },
    dispatch,
    getState
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

export const createSetLocalStorageTask = (
  storageValue: string,
  storageKey: string,
  handlers: *
) => {
  return new SetLocalStorageTask(
    storageValue,
    storageKey,
    handlers
  )
}
```
Pretty straightforward? I hope so!

Want to see a test?
```js
it('should set item on local storage ' +
   'when performing a local storage task', () => {
  const task = createSetLocalStorageTask(
    'testKey',
    'testValue',
    {
      success: (result) => ({
        type: 'STORAGE_SUCCESS',
        payload: result
      }),
      failure: () => ({ type: 'noop' }),
      }
    )

  const mockLocalStorage = {
    setItem: jest.fn(),
  }

  task.perform(
    { localStorage: mockLocalStorage },
    jest.fn(),
    jest.fn()
  )
  expect(mockLocalStorage.setItem).toHaveBeenCalledWith('testKey', 'testValue')
})
```
Well, this seems testable, right? The great thing is that you can do quite anything with the task, you can make them promises, if you don't like the API.
