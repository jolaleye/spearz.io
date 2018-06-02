import React from 'react';

import './Game.css';
import Canvas from './Canvas';
import LeaderboardContainer from './Leaderboard/LeaderboardContainer';
import StatusContainer from './Status/StatusContainer';
import Message from './Message/Message';

const Game = ({ socket, assets }) => (
  <div className="game">
    <Canvas socket={socket} assets={assets} />
    <LeaderboardContainer socket={socket} />
    <StatusContainer socket={socket} />
    <Message socket={socket} />
  </div>
);

export default Game;
