import React from 'react';

import './FriendModal.css';

const FriendModal = ({ active, toggle, room, joinRoom, handleCodeChange, codeValue }) => (
  <div className={`modal ${active ? 'is-active' : null}`}>
    <div className="modal-background" onClick={toggle} />
    <div className="f-modal modal-card">
      <div className="f-modal__content modal-card-body">
        <span className="f-modal__header">Play with friends!</span>
        <span className="f-modal__instructions">Tell them to enter this code...</span>
        <span className="f-modal__code">{room}</span>
        <span className="f-modal__instructions">Or enter someone's code here...</span>
        <form className="f-form form" onSubmit={joinRoom}>
          <div className="field">
            <div className="control">
              <input className="input is-medium" type="text" placeholder="Room code"
                value={codeValue} onChange={handleCodeChange}
              />
            </div>
          </div>
          <div className="field">
            <div className="control">
              <button className="f-form__btn button is-rounded is-medium" type="submit">
                JOIN
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
    <button className="modal-close is-large" aria-label="close" onClick={toggle} />
  </div>
);

export default FriendModal;
