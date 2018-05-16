import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import io from 'socket.io-client';

import './main.css';
import StartContainer from './components/Start/StartContainer';
import GameContainer from './components/Game/GameContainer';
import Restart from './components/Restart';

class App extends Component {
  state = {
    socket: null,
    room: null,
    view: 'start',
  };

  async componentDidMount() {
    // connect to the server
    await this.setState({ socket: io.connect() });
    const { socket } = this.state;

    socket.on('roomId', id => this.setState({ room: id }));
    socket.on('ready', () => this.changeView('game'));
  }

  changeView = view => this.setState({ view });

  render = () => {
    const { socket, view, room } = this.state;

    if (view === 'start') {
      return <StartContainer socket={socket} room={room} />;
    } else if (view === 'game') {
      return <GameContainer socket={socket} />;
    }
    return <Restart />;
  }
}

ReactDOM.render(<App />, document.getElementById('root'));
