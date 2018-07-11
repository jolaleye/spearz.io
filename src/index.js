import React, { Component } from 'react';
import ReactDOM from 'react-dom';

import './main.css';
import StartContainer from './components/Start/StartContainer';
import Game from './components/Game/Game';
import { unpack } from './services/cereal';
import assetManager from './assetManager';

class App extends Component {
  state = {
    mode: 'start',
    socket: null,
    connected: false,
    loaded: false,
  }

  async componentDidMount() {
    // WebSocket connection
    this.connect();

    // assets
    await assetManager.load();
    this.setState({ loaded: true });
  }

  connect = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host = process.env.NODE_ENV === 'production' ? window.location.host : 'localhost:3001';
    const socket = new WebSocket(`${protocol}://${host}`);
    this.setState({ socket });

    socket.addEventListener('open', () => {
      this.setState({ connected: true });
    });

    socket.addEventListener('message', packet => {
      const data = unpack(packet.data);
      switch (data._) {
        case 'id':
          socket.id = data.id;
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
    if (this.state.mode === 'start') {
      return (
        <StartContainer socket={this.state.socket} connected={this.state.connected}
          loaded={this.state.loaded} />
      );
    } else if (this.state.mode === 'game') {
      return <Game socket={this.state.socket} changeMode={this.changeMode} />;
    }

    return null;
  };
}

ReactDOM.render(<App />, document.getElementById('root'));
