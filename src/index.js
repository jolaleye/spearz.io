import React, { Component, Fragment } from 'react';
import ReactDOM from 'react-dom';
import io from 'socket.io-client';

import './main.css';
import StartContainer from './components/Start/StartContainer';
import Game from './components/Game/Game';
import Restart from './components/Restart/Restart';
import Mobile from './components/Mobile/Mobile';
import assetManager from './AssetManager';

class App extends Component {
  state = {
    socket: null,
    room: '',
    view: 'start',
    deathMsg: '',
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

    // recieving room id
    socket.on('roomId', id => this.setState({ room: id }));
    // name submitted, ready to play
    socket.on('ready', () => this.changeView('game'));
    // player died, move to restart screen
    socket.on('dead', deathMsg => {
      this.changeView('restart');
      this.setState({ deathMsg });
    });
  }

  changeView = view => this.setState({ view });

  getView = () => {
    const { socket, room, view, deathMsg } = this.state;

    switch (view) {
      case 'start':
        return <StartContainer socket={socket} room={room} />;
      case 'game':
        return <Game socket={socket} />;
      case 'restart':
        return <Restart changeView={this.changeView} deathMsg={deathMsg} />;
      default:
        return <div></div>;
    }
  }

  render = () => {
    if (!this.state.socket) return <div></div>;

    return (
      <Fragment>
        <div className="is-hidden-mobile">
          {this.getView()}
        </div>
        <div className="is-hidden-tablet">
          <Mobile />
        </div>
      </Fragment>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('root'));
