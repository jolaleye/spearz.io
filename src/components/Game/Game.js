import React, { Component } from 'react';

import './Game.css';
import Canvas from './Canvas/Canvas';
import LeaderboardContainer from './Leaderboard/LeaderboardContainer';
import StatusContainer from './Status/StatusContainer';
import Message from './Message/Message';
import assetManager from '../../AssetManager';

const { sounds } = assetManager;

class Game extends Component {
  componentDidMount() {
    sounds.soundtrack.play();
    this.props.socket.on('hit', () => sounds.hit.play());
  }

  componentWillUnmount() {
    this.props.socket.off('hit');
  }

  render = () => (
    <div className="game">
      <Canvas socket={this.props.socket} />
      <LeaderboardContainer socket={this.props.socket} />
      <StatusContainer socket={this.props.socket} />
      <Message socket={this.props.socket} />
    </div>
  );
}

export default Game;
