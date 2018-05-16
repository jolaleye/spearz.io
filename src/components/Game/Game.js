import React from 'react';

import './Game.css';
import Canvas from './Canvas';

const Game = ({ socket }) => (
  <div className="game">
    <Canvas socket={socket} />
  </div>
);

export default Game;
