import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import io from 'socket.io-client';
import { Howler } from 'howler';

import './main.css';
import StartContainer from './components/Start/StartContainer';
import Game from './components/Game/Game';
import Restart from './components/Restart/Restart';
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
    audio: true,
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
    // player died, move to restart screen
    socket.on('dead', () => this.changeView('restart'));
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

  toggleAudio = async () => {
    await this.setState(prevState => ({ audio: !prevState.audio }));
    Howler.mute(!this.state.audio);
  }

  render = () => {
    const { socket, view, room, allLoaded, assets } = this.state;

    if (view === 'start') {
      return (
        <StartContainer socket={socket} room={room}
          toggleAudio={this.toggleAudio} audio={this.state.audio}
        />
      );
    } else if (view === 'game') {
      return allLoaded
        ? <Game socket={socket} assets={assets} />
        : <div>loading</div>;
    }
    return <Restart changeView={this.changeView} />;
  }
}

ReactDOM.render(<App />, document.getElementById('root'));
