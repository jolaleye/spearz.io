import React from 'react';

import './Leaderboard.css';

const LeaderboardItem = ({ rank, name, score, active }) => (
  <div className={`leaderboard__item ${active ? 'active' : null}`}>
    <span className="l-item__rank">{rank}.</span>
    <span className="l-item__name">{name}</span>
    <span className="l-item__score">{score}</span>
  </div>
);

const Leaderboard = ({ leaders }) => {
  const leaderboard = leaders.map(player => (
    <LeaderboardItem key={player.rank} rank={player.rank} name={player.name}
      score={player.score} active={player.active}
    />
  ));

  return (
    <div className="leaderboard">
      <span className="leaderboard__header">Leaderboard</span>
      {leaderboard}
    </div>
  );
};

export default Leaderboard;
