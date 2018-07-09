import React from 'react';

import './Death.css';

const Death = ({ dead }) => {
  if (dead.from === 'bounds') {
    return (
      <div className="death bounds">
        <span>{dead.msg}</span>
      </div>
    );
  }

  return null;
};

export default Death;
