import React from 'react';

import './Score.css';

const Score = ({ value }) => (
  <div className="score-chain">+ {value}</div>
);

export default Score;
