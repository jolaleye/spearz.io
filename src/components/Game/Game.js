import React, { Component } from 'react';

import './Game.css';
import Canvas from './Canvas/Canvas';
import LeaderboardContainer from './Leaderboard/LeaderboardContainer';
import StatusContainer from './Status/StatusContainer';
import Message from './Message/Message';
import assetManager from '../../services/assetManager';
import parser from '../../services/parser';

const { sounds } = assetManager;
const { decode } = parser;

class Game extends Component {
  componentDidMount() {
    if (!sounds.soundtrack.playing()) sounds.soundtrack.play();
    this.props.socket.addEventListener('message', ({ data }) => {
      const message = decode(data);
      if (message._type === 'hit') sounds.hit.play();
    });
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
