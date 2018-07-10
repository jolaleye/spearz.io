import React from 'react';

import './Death.css';

const Death = ({ dead }) => {
  if (dead.from === 'bounds') {
    return (
      <div className="death bounds">
        <span>{dead.msg}</span>
      </div>
    );
  } else if (dead.from === 'player') {
    return (
      <div className="death player">
        <span>Killed by</span>
        <span className="name">{dead.name ? dead.name : '<unnamed>'}</span>
      </div>
    );
  }

  return null;
};

export default Death;
