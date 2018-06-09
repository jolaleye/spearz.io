import React, { Component, Fragment } from 'react';
import ReactDOM from 'react-dom';

import './main.css';
import parser from './services/parser';
import assetManager from './services/assetManager';
import StartContainer from './components/Start/StartContainer';
import Game from './components/Game/Game';
import Restart from './components/Restart/Restart';
import Mobile from './components/Mobile/Mobile';

const { decode } = parser;

class App extends Component {
  state = {
    socket: null,
    room: '',
    view: 'start',
    deathMsg: '',
  }

  async componentDidMount() {
    // connect to the server
    await this.setState({
      socket: process.env.NODE_ENV === 'production'
        ? new WebSocket(`${window.location.protocol === 'https:' ?
          'wss' : 'ws'}://${window.location.host}`)
        : new WebSocket('ws://localhost:3001'),
    });
    const { socket } = this.state;
    socket.binaryType = 'arraybuffer';

    socket.addEventListener('message', ({ data }) => {
      const packet = decode(data);
      switch (packet._type) {
        // recieving socket id
        case 'id':
          socket.id = packet.id;
          break;
        // recieving room id
        case 'roomId': return this.setState({ room: packet.id });
        // name submitted, ready to play
        case 'ready': return this.changeView('game');
        // player died, move to restart screen
        case 'dead':
          this.changeView('restart');
          this.setState({ deathMsg: { type: packet.type, name: packet.name } });
          break;
        default: return null;
      }
    });

    // load game assets
    assetManager.loadAssets();
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
