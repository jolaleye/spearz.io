import React from 'react';

import './Info.css';

const Info = ({ open, toggle }) => (
  <div className={`info-modal modal ${open ? 'is-active' : ''}`}>
    <div className="modal-background" onClick={toggle}></div>
    <button className="modal-close is-large" aria-label="close" onClick={toggle} />
    <div className="modal-content info-modal__content">
      <div className="box info">

        <div className="info__contact">
          <span className="contact-label">Contact:</span>contact.spearz@gmail.com
        </div>

        <div className="info__reddit">
          Join the community on <a href="">Reddit</a>!
        </div>

        <div className="info__changelog">
          <span className="changelog-label">Changelog</span>
        </div>

      </div>
    </div>
  </div>
);

export default Info;
