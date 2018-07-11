import React from 'react';

import './Leaderboard.css';

const Leaderboard = ({ leaderboard }) => (
  <div className="leaderboard">
    <span className="leaderboard__header">Leaderboard</span>
    {leaderboard.map(player => (
      <div key={player.rank} className={`leaderboard__player ${player.active ? 'active' : ''}`}>
        <span className="leaderboard__rank">{player.rank}.</span>
        <span className="leaderboard__name">{player.name === '' ? '<unnamed>' : player.name}</span>
        <span className="leaderboard__score">{player.score}</span>
      </div>
    ))}
  </div>
);

export default Leaderboard;
