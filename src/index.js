import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';
import { Howler } from 'howler';

import './main.css';
import StartContainer from './components/Start/StartContainer';
import Game from './components/Game/Game';
import Mobile from './components/Mobile/Mobile';
import { unpack, pack } from './services/cereal';
import assetManager from './assetManager';

class App extends Component {
  state = {
    mobile: false,
    mode: 'start',
    socket: null,
    connected: false,
    connectionAttempts: 0,
    loaded: false,
    roomKey: '',
    nickname: '',
    audio: true,
  }

  async componentDidMount() {
    // check for mobile
    window.addEventListener('touchstart', () => this.setState({ mobile: true }));

    // WebSocket connection
    this.connect();

    // assets
    await assetManager.load();
    this.setState({ loaded: true });
  }

  connect = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host = process.env.NODE_ENV === 'production' ? 'spearz.io' : 'localhost:3001';
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

  handleNameChange = event => {
    this.setState({ nickname: event.target.value });
  }

  joinGame = event => {
    event.preventDefault();
    if (this.state.connected && this.state.loaded) {
      this.state.socket.send(pack('joinGame', { nickname: _.trim(this.state.nickname) }));
    }
  }

  changeMode = mode => {
    this.setState({ mode });
  }

  toggleAudio = async () => {
    await this.setState(prevState => ({ audio: !prevState.audio }));
    Howler.mute(!this.state.audio);
  }

  render = () => {
    if (this.state.mobile) {
      return <Mobile />;
    } else if (this.state.mode === 'start') {
      return (
        <StartContainer socket={this.state.socket} connected={this.state.connected}
          loaded={this.state.loaded} roomKey={this.state.roomKey}
          audio={this.state.audio} toggleAudio={this.toggleAudio} nickname={this.state.nickname}
          handleNameChange={this.handleNameChange} joinGame={this.joinGame} />
      );
    } else if (this.state.mode === 'game') {
      return <Game socket={this.state.socket} changeMode={this.changeMode} />;
    }

    return null;
  };
}

ReactDOM.render(<App />, document.getElementById('root'));
