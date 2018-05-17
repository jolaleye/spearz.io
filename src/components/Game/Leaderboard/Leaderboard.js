import React from 'react';

import './Leaderboard.css';

const LeaderboardItem = ({ rank, name, score, player }) => (
  <div className={`leaderboard__item ${player ? 'player' : null}`}>
    <span className="l-item__rank">{rank}.</span>
    <span className="l-item__name">{name}</span>
    <span className="l-item__score">{score}</span>
  </div>
);

const Leaderboard = () => (
  <div className="leaderboard">
    <span className="leaderboard__header">Leaderboard</span>
    <LeaderboardItem rank={'1'} name={'Knightshade'} score={'1100'} />
    <LeaderboardItem rank={'2'} name={'Squidle'} score={'900'} />
    <LeaderboardItem rank={'3'} name={'colossubs'} score={'850'} />
    <LeaderboardItem rank={'4'} name={'gorillala'} score={'800'} />
    <LeaderboardItem rank={'5'} name={'chillyMango'} score={'750'} />
    <LeaderboardItem rank={'6'} name={'MiMicDunker'} score={'600'} />
    <LeaderboardItem rank={'7'} name={'xPinkCoconutx'} score={'450'} />
    <LeaderboardItem rank={'8'} name={'CountryLeMur'} score={'400'} />
    <LeaderboardItem rank={'9'} name={'BlushingBab00n'} score={'300'} />
    <LeaderboardItem rank={'10'} name={'Phantomboy'} score={'150'} />
    <LeaderboardItem rank={'32'} name={'most palone'} score={'50'} player={true} />
  </div>
);

export default Leaderboard;
