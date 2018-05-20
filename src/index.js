import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import io from 'socket.io-client';

import './main.css';
import StartContainer from './components/Start/StartContainer';
import GameContainer from './components/Game/GameContainer';
import Restart from './components/Restart';
import backgroundCell from './assets/bg-cell.png';

const { LoadQueue } = window.createjs;

class App extends Component {
  state = {
    socket: null,
    room: null,
    view: 'start',
    queue: null,
    assets: {},
    allLoaded: false,
  };

  async componentDidMount() {
    // connect to the server
    await this.setState({ socket: io.connect('http://localhost:3001') });
    const { socket } = this.state;

    // load game assets
    this.loadAssets();

    // receiving the current room id
    socket.on('roomId', id => this.setState({ room: id }));

    // name submitted, ready to play
    socket.on('ready', () => this.changeView('game'));
  }

  loadAssets = async () => {
    await this.setState({ queue: new LoadQueue(false) });
    const { queue } = this.state;

    const handleFileLoad = e => {
      // add each asset to state
      this.setState(prevState => ({
        assets: { ...prevState.assets, [e.item.id]: e.result },
      }));
    };
    queue.on('fileload', handleFileLoad, this);
    queue.on('complete', () => this.setState({ allLoaded: true }));

    // list of assets to be loaded
    queue.loadManifest([
      { id: 'backgroundCell', src: backgroundCell },
    ]);
  }

  changeView = view => this.setState({ view });

  render = () => {
    const { socket, view, room, allLoaded, assets } = this.state;

    if (view === 'start') {
      return <StartContainer socket={socket} room={room} />;
    } else if (view === 'game') {
      return allLoaded
        ? <GameContainer socket={socket} assets={assets} />
        : <div>loading</div>;
    }
    return <Restart />;
  }
}

ReactDOM.render(<App />, document.getElementById('root'));
