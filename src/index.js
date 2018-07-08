import React, { Component } from 'react';
import ReactDOM from 'react-dom';

import './main.css';
import StartContainer from './components/Start/StartContainer';
import Game from './components/Game/Game';
import { unpack } from './services/cereal';
import assetManager from './assetManager';

class App extends Component {
  state = {
    socket: null,
    mode: 'start',
    loaded: false,
  }

  async componentDidMount() {
    // WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host = process.env.NODE_ENV === 'production' ? window.location.host : 'localhost:3001';
    const socket = new WebSocket(`${protocol}://${host}`);
    await this.setState({ socket });
    this.handleSocket();

    // assets
    await assetManager.load();
    this.setState({ loaded: true });
  }

  handleSocket = () => {
    const { socket } = this.state;

    socket.addEventListener('message', packet => {
      const data = unpack(packet.data);
      switch (data._) {
        case 'id':
          socket.id = data.id;
          this.setState({ socket });
          break;

        case 'ready':
          this.changeMode('game');
          break;

        default: break;
      }
    });
  }

  changeMode = mode => {
    this.setState({ mode });
  }

  render = () => {
    if (!this.state.socket) {
      return <div>Connecting...</div>;
    } else if (this.state.mode === 'start') {
      return <StartContainer socket={this.state.socket} />;
    } else if (this.state.mode === 'game') {
      return this.state.loaded ? <Game /> : <div>Loading...</div>;
    }

    return null;
  };
}

ReactDOM.render(<App />, document.getElementById('root'));
