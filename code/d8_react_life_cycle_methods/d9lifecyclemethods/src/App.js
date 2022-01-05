import React from 'react'
import './App.css'

class App extends React.Component {
  constructor () {
    super()
    this.state = {
      myMessageToTheUniverse:
        'Time is running away. You should run with it or you will be left behind.',
      no:0
    }
    console.log('We are in constructor')
    this.handleMessageUpdate = this.handleMessageUpdate.bind(this)
  }

  componentWillMount(){
    console.log('We are in componentWillMount')
  }

  componentDidMount () {
    console.log('We are in componentDidMount')
  }

  componentDidUpdate (prevProps, prevState) {
    console.log(prevProps,prevState)
    console.log(prevState.no)
    console.log('WE are in componentDidUpdate')
  }

  handleMessageUpdate(){
    this.setState({
      myMessageToTheUniverse:
        "You are smart, but we don't know that, so prove it!"
    })
  }

  render () {
    return (
      <div className='App'>
        <header className='App-header'>
          <p>
            {this.state.myMessageToTheUniverse}
            <br></br>
            <button onClick={this.handleMessageUpdate}>Update</button>
          </p>
        </header>
      </div>
    )
  }
}

// componentDidMount()
// componentWillMount()
// componentDidUpdate()
// componentWillUnMount()
// constructor

export default App
