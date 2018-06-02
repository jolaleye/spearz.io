import React from 'react';

import './Start.css';
import logo from '../../assets/logo.svg';
import FriendModalContainer from './FriendModal/FriendModalContainer';

const Start = ({
  socket, handleNameChange, handleSubmit, name, room, toggleModal, modalOpen, toggleAudio, audio,
}) => (
  <div className="start">
    <img className="logo" src={logo} alt="Spearz.io" />

    <form className="form" onSubmit={handleSubmit}>
      <div className="field">
        <div className="control">
          <input className="form__name input is-large" type="text" placeholder="Nickname"
            value={name} onChange={handleNameChange} maxLength='15'
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
    </div>

    <div className="options">
      <div className="audio" onClick={toggleAudio}>
        <span className="audio__icon icon is-large">{
          audio ? <i className="fas fa-volume-up fa-2x"></i>
            : <i className="fas fa-volume-off fa-2x"></i>
        }</span>
      </div>
      <div className="friends" onClick={toggleModal}>
        <span className="friends__icon icon is-large">
          <i className="fas fa-user-friends fa-2x"></i>
        </span>
      </div>
    </div>

    <FriendModalContainer socket={socket} active={modalOpen} toggle={toggleModal} room={room} />
  </div>
);

export default Start;
