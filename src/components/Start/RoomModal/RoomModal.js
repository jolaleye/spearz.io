import React from 'react';

import './RoomModal.css';

const RoomModal = ({ modal, toggleModal, currentKey, roomKey, handleKeyChange }) => (
  <div className={`modal ${modal ? 'is-active' : ''}`}>
    <div className="modal-background" onClick={toggleModal}></div>

    <div className="modal-content">
      <div className="box room-modal">

        <p className="room-modal__header">Play with friends!</p>
        <p className="room-modal__text">Share this room key...</p>
        <p className="room-modal__key">{currentKey}</p>
        <p className="room-modal__text">Or enter a key here...</p>
        <form className="room-modal__form">
          <input className="input" type="text" value={roomKey} placeholder="Room key"
            onChange={handleKeyChange} />
          <button className="button is-rounded" type="submit">JOIN</button>
        </form>

      </div>
    </div>

    <button className="modal-close is-large" aria-label="close" onClick={toggleModal}></button>
  </div>
);

export default RoomModal;
