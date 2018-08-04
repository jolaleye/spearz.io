import React from 'react';
import { Users, Volume2, VolumeX, Info } from 'react-feather';

import './Start.css';
import logo from '../../assets/logo.svg';
import Privacy from '../Privacy/Privacy';

const Start = ({
  ready, nickname, handleNameChange, audio,
  toggleAudio, toggleModal, toggleInfo, joinGame,
  privacy, togglePrivacy,
}) => (
  <div className="start">

    <img className="start__logo" src={logo} alt="Spearz.io" />

    <form className="start__form" onSubmit={joinGame}>
      <input className="input" type="text" value={nickname} placeholder="Nickname" maxLength="12"
        spellCheck="false" onChange={handleNameChange} />
      {!ready
        ? <button className="button is-rounded is-loading">Loading...</button>
        : <button className="button is-rounded" type="submit">PLAY</button>
      }
    </form>

    <div className="start__instructions">
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

    <div className="start__info">
      <Info className="icon" onClick={toggleInfo} />
    </div>

    <div className="start__more">
      <a href="http://iogames.space" target="_blank" rel="noopener noreferrer">
        More IO Games
      </a>
    </div>

    <div className="start__privacy">
      {/* eslint-disable */}
      <span>Cookies are used by a third party (Google) to serve ads (Google Adsense) and analyze traffic (Google Analytics). By continuing to use and play spearz.io you consent to the use of cookies. </span>
      {/* eslint-enable */}
      <span className="moreinfo" onClick={togglePrivacy}>More Information.</span>
    </div>
    <Privacy open={privacy} toggle={togglePrivacy} />

  </div>
);

export default Start;
