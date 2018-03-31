import React, { Component } from 'react'
import logo from './logo.svg'
import './App.css'
import { connect } from 'react-redux'

import { createFetchTask, createSetLocalStorageTask } from './actions'


class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to React</h1>
        </header>
        <button onClick={this.props.requestJson}>Request that json!</button>
        {this.props.posts.length > 0 ? (
          <div>
            <h2>Posts:</h2>
            <ul className='posts'>
              {this.props.posts.map((post) => (
                <div key={post.id}>
                  <h3>{post.title}</h3>
                  <p>{post.body}</p>
                </div>
              ))}
            </ul>
        </div>
      ) : <h2>No posts :(</h2>}
      </div>
    )
  }
}

export default connect((state) => ({
  posts: state.posts
}), {
  requestJson: () => createFetchTask('http://jsonplaceholder.typicode.com/posts/', {
    success: (result, state) => createSetLocalStorageTask('initialState', JSON.stringify(result), {
      success: () => ({ type: 'POSTS_ADD', payload: result }),
      failur: () => ({ type: 'LOCAL_STORAGE_ERROR' }),
    }),
    failure: () => ({ type: 'noop' })
  }),
})(App)
