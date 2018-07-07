import React, { Component } from 'react';
import ReactDOM from 'react-dom';

import './main.css';
import StartContainer from './components/Start/StartContainer';
import { unpack } from './services/cereal';

class App extends Component {
  state = {
    socket: null,
  }

  componentDidMount() {
    // WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host = process.env.NODE_ENV === 'production' ? window.location.host : 'localhost:3001';
    const socket = new WebSocket(`${protocol}://${host}`);
    this.setState({ socket });
  }

  handleSocket = () => {
    const { socket } = this.state;

    socket.addEventListener('message', packet => {
      const data = unpack(packet.data);
      if (data._ === 'id') {
        socket.id = data.id;
        this.setState({ socket });
      }
    });
  }

  render = () => (
    this.state.socket
      ? <StartContainer socket={this.state.socket} />
      : <div>Connecting...</div>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
