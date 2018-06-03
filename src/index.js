import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import io from 'socket.io-client';

import './main.css';
import StartContainer from './components/Start/StartContainer';
import Game from './components/Game/Game';
import Restart from './components/Restart/Restart';
import assetManager from './AssetManager';

class App extends Component {
  state = {
    socket: null,
    view: 'start',
  };

  async componentDidMount() {
    // connect to the server
    await this.setState({
      socket: process.env.NODE_ENV === 'production' ?
        io.connect() : io.connect('http://localhost:3001'),
    });
    const { socket } = this.state;

    // load game assets
    await assetManager.loadAssets();

    // name submitted, ready to play
    socket.on('ready', () => this.changeView('game'));
    // player died, move to restart screen
    socket.on('dead', () => this.changeView('restart'));
  }

  changeView = view => this.setState({ view });

  render = () => {
    const { socket, view } = this.state;

    if (!socket) return <div></div>;

    switch (view) {
      case 'start':
        return <StartContainer socket={socket} />;
      case 'game':
        return <Game socket={socket} />;
      case 'restart':
        return <Restart changeView={this.changeView} />;
      default:
        return <div></div>;
    }
  }
}

ReactDOM.render(<App />, document.getElementById('root'));
