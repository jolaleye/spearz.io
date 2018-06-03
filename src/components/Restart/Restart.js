import React from 'react';

import './Restart.css';

const Restart = ({ changeView, killedBy }) => (
  <div className="restart">
    <span className="restart__killed-by">Killed by <span>{killedBy}</span></span>
    <button className="form__btn button is-large is-rounded" onClick={() => changeView('start')}>
      <span className="icon"><i className="fas fa-arrow-right"></i></span>
    </button>
  </div>
);

export default Restart;
