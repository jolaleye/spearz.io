import React from 'react';

import './Restart.css';

const Restart = ({ changeView }) => (
  <div className="restart">
    <button className="form__btn button is-large is-rounded" onClick={() => changeView('start')}>
      <span className="icon"><i className="fas fa-arrow-right"></i></span>
    </button>
  </div>
);

export default Restart;
