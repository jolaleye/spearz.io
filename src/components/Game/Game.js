import React from 'react';

import './Game.css';
import Canvas from './Canvas';
import LeaderboardContainer from './Leaderboard/LeaderboardContainer';
import StatusContainer from './Status/StatusContainer';

const Game = ({ socket }) => (
  <div className="game">
    <Canvas socket={socket} />
    <LeaderboardContainer socket={socket} />
    <StatusContainer socket={socket} />
  </div>
);

export default Game;
