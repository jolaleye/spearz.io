import React from 'react';

import './Restart.css';

const Restart = ({ changeView, deathMsg }) => (
  <div className="restart">
    {deathMsg.type === 'bounds' ? (
      <span className="restart__death">You left the fight... (－‸ლ)</span>
    ) : (
      <span className="restart__death">
        Speared by <span className="restart__death-name">{deathMsg.name}</span>
      </span>
    )}
    <button className="form__btn button is-large is-rounded" onClick={() => changeView('start')}>
      <span className="icon"><i className="fas fa-arrow-right"></i></span>
    </button>
  </div>
);

export default Restart;
