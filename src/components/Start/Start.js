import React from 'react';
import { Users, Volume2, VolumeX } from 'react-feather';

import './Start.css';
import logo from '../../assets/logo.svg';

const Start = ({ audio, toggleAudio, toggleModal, nickname, handleNameChange }) => (
  <div className="start">

      <img className="start__logo" src={logo} alt="Spearz.io" />

      <form className="start__form">
        <input className="input" type="text" value={nickname} placeholder="Nickname" maxLength="12"
          spellCheck="false" onChange={handleNameChange} />
        <button className="button is-rounded" type="submit">PLAY</button>
      </form>

      <div className="start__info">
        <p>Move with your <span>mouse</span></p>
        <p><span>Click</span> or press <span>space</span> to throw your spear</p>
      </div>

      <div className="start__controls">
        <Users className="icon" onClick={toggleModal} />
        {audio
          ? <Volume2 className="icon" onClick={toggleAudio} />
          : <VolumeX className="icon" onClick={toggleAudio} />
        }
      </div>

  </div>
);

export default Start;
