import React, { Component, Fragment } from 'react';
import ReactDOM from 'react-dom';

import './main.css';
import StartContainer from './components/Start/StartContainer';
import Game from './components/Game/Game';
import Mobile from './components/Mobile/Mobile';
import { unpack, pack } from './services/cereal';
import assetManager from './assetManager';

class App extends Component {
  state = {
    mode: 'start',
    socket: null,
    connected: false,
    connectionAttempts: 0,
    loaded: false,
    roomKey: '',
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
    socket.binaryType = 'arraybuffer';

    this.setState(prevState => ({ socket, connectionAttempts: prevState.connectionAttempts + 1 }));

    socket.addEventListener('open', () => {
      this.setState({ connected: true });
    });

    socket.addEventListener('message', packet => {
      const data = unpack(packet.data);
      switch (data._) {
        case 'ping':
          socket.send(pack('pong'));
          break;

        case 'id':
          socket.id = data.id;
          console.log(`You are player ${data.id}`);
          break;

        case 'roomKey':
          this.setState({ roomKey: data.key });
          console.log(`Connected to room ${data.key}`);
          break;

        case 'ready':
          this.changeMode('game');
          break;

        default: break;
      }
    });

    // if the connection drops, go back to the start screen and reconnect
    socket.addEventListener('close', () => {
      this.setState({ connected: false });
      this.changeMode('start');

      // if the connection keeps getting dropped, stop trying
      if (this.state.connectionAttempts < 10) this.connect();
      else console.log('Can\'t connect to the server :(');
    });
  }

  changeMode = mode => {
    this.setState({ mode });
  }

  render = () => {
    if (this.state.mode === 'start') {
      return (
        <Fragment>
          <StartContainer socket={this.state.socket} connected={this.state.connected}
            loaded={this.state.loaded} roomKey={this.state.roomKey} />
          <Mobile />
        </Fragment>
      );
    } else if (this.state.mode === 'game') {
      return (
        <Fragment>
          <Game socket={this.state.socket} changeMode={this.changeMode} />
          <Mobile />
        </Fragment>
      );
    }

    return null;
  };
}

ReactDOM.render(<App />, document.getElementById('root'));
