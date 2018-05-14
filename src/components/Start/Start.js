import React from 'react';

import './start.css';
import logo from './logo.svg';

const Start = ({ handleNameChange, handleSubmit, name }) => (
  <div className="start">
    <img className="logo" src={logo} alt="Spearz.io" />
    <form className="form" onSubmit={handleSubmit}>
      <div className="field">
        <div className="control">
          <input className="form__name input is-large" type="text" placeholder="Nickname"
            value={name} onChange={handleNameChange}
          />
        </div>
      </div>
      <div className="field">
        <div className="control">
          <button className="form__btn button is-large is-rounded" type="submit">PLAY</button>
        </div>
      </div>
    </form>
    <div className="instructions content">
      <p><span>Move</span> with your mouse</p>
      <p><span>Click</span> or press <span>Space</span> to throw your spear</p>
      <p>Hold <span>W</span> to put up your shield</p>
    </div>
    <div className="friends">
      <button className="friends__btn button is-rounded">
        <span className="icon"><i class="fas fa-user-friends"></i></span>
        <span>Play with friends!</span>
      </button>
    </div>
  </div>
);

export default Start;
