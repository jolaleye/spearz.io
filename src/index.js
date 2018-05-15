import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import io from 'socket.io-client';

import './main.css';
import StartContainer from './components/Start/StartContainer';
import Game from './components/Game';
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
    socket.on('rooms', rooms => console.log(rooms));
  }

  changeView = view => this.setState({ view });

  render = () => {
    const { view } = this.state;

    if (view === 'start') {
      return (
        <StartContainer socket={this.state.socket}
          changeView={this.changeView} room={this.state.room}
        />
      );
    } else if (view === 'game') {
      return <Game changeView={this.changeView} />;
    }
    return <Restart changeView={this.changeView} />;
  };
}

ReactDOM.render(<App />, document.getElementById('root'));
