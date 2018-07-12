import React from 'react';

import './RoomModal.css';

const RoomModal = ({ modal, toggleModal, currentKey, roomKey, msg, handleKeyChange, joinRoom }) => (
  <div className={`modal is-hidden-touch ${modal ? 'is-active' : ''}`}>
    <div className="modal-background" onClick={toggleModal}></div>

    <div className="modal-content">
      <div className="box room-modal">

        <p className="room-modal__header">Play with friends!</p>
        <p className="room-modal__text">Share this room key...</p>
        <p className="room-modal__key">{currentKey}</p>
        <p className="room-modal__text">Or enter a key here...</p>
        <form className="room-modal__form" onSubmit={joinRoom}>
          <div className="field">
            <div className="control">
              <input className="input" type="text" value={roomKey} placeholder="Room key"
                maxLength="9" onChange={handleKeyChange} />
            </div>
            {msg
              ? <p className={`help has-text-${msg.code === 0 ? 'danger' : 'success'}`}>
                  {msg.msg} {msg.code === 0 ? '¯\\_(o_o)_/¯' : '＼(^o^)／'}
                </p>
              : null
            }
          </div>
          <button className="button is-rounded" type="submit">JOIN</button>
        </form>

      </div>
    </div>

    <button className="modal-close is-large" aria-label="close" onClick={toggleModal}></button>
  </div>
);

export default RoomModal;
