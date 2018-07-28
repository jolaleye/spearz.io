import React from 'react';

import './Info.css';
import Changelog from './Changelog/Changelog';

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
          <span>Join the community on </span>
          <a href="https://www.reddit.com/r/spearzio/">Reddit</a>!
        </div>

        <div className="info__privacy">
          <a className="iubenda-white iubenda-embed" title="Privacy Policy"
            href="https://www.iubenda.com/privacy-policy/44536004">
            Privacy Policy
          </a>
        </div>

        <Changelog />

      </div>
    </div>
  </div>
);

export default Info;
