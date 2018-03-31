// @flow

export interface IStore<State: {}> {
  getState(): State,
  dispatch(): void,
}

export class Task<Services: {}, State: {}, Dispatch: (Action<$Subtype<Task<State>>>) => void> {
  _failure: *
  _success: *

  constructor<SuccessfulResult: {}>({ success, failure }: {|
    success: (result: SuccessfulResult, geState: () => State) => Action<Task<State, $PropertyType<IStore<State>, 'dispatch'>>>,
    failure: (error: Error,  state: State) => Action<Task<State, $PropertyType<IStore<State>, 'dispatch'>>>,
  |}) {
    this._success = success
    this._failure = failure
  }

  perform(services: Services, dispatch: Dispatch, getState: () => State): any {
    throw new Error('Not implemented! You must implement you own perform method of subclass of Task!')
  }
}


export type Action<A> = A | { type: string, payload?: Object }


export const taskMiddleware = <S: {}, State: {}>(services: S) =>
  (store: IStore<State>) =>
    (next: Action<$Subtype<Task<State, $PropertyType<IStore<State>, 'dispatch'>>>> => void) =>
      (action: Action<$Subtype<Task<State, $PropertyType<IStore<State>, 'dispatch'>>>>) => {
      if (action instanceof Task) {
        action.perform(services, store.dispatch, store.getState)
        return
      }

      let result = next(action)
      return result
}


export default taskMiddleware
