import React, { Component } from 'react';

import './Info.css';
import Changelog from './Changelog/Changelog';
import Privacy from './Privacy/Privacy';

class Info extends Component {
  state = {
    privacyModal: false,
  }

  togglePrivacy = () => {
    this.setState(prevState => ({ privacyModal: !prevState.privacyModal }));
  }

  render = () => (
    <div className={`info-modal modal ${this.props.open ? 'is-active' : ''}`}>
      <div className="modal-background" onClick={this.props.toggle}></div>
      <button className="modal-close is-large" aria-label="close" onClick={this.props.toggle} />
      <div className="modal-content info-modal__content">
        <div className="box info">

          <div className="info__contact">
            <span className="contact-label">Contact: </span>
            <span>contact.spearz@gmail.com</span>
          </div>

          <div className="info__reddit">
            <span>Join the community on </span>
            <a href="https://www.reddit.com/r/spearzio/">Reddit</a>!
          </div>

          <span className="info__privacy" onClick={this.togglePrivacy}>Privacy & Cookies</span>

          <Privacy open={this.state.privacyModal} toggle={this.togglePrivacy} />
          <Changelog />

        </div>
      </div>
    </div>
  );
}

export default Info;
