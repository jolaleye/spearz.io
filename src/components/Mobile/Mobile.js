import React, { Fragment, Component } from 'react';
import { Info as InfoIcon } from 'react-feather';

import './Mobile.css';
import logo from '../../assets/logo.svg';
import Info from '../Info/Info';

class Mobile extends Component {
  state = {
    info: false,
  }

  toggleInfo = () => {
    this.setState(prevState => ({ info: !prevState.info }));
  }

  render = () => (
    <Fragment>
      <div className="mobile">
        <img src={logo} alt="spearz.io"/>
        <div className="text">
          <span>
            Spearz.io isn't designed for touch devices. Please move to another device to play.
          </span>
          <span role="img" aria-label="Slightly Smiling Face"> 🙂</span>
        </div>
        <InfoIcon className="icon" onClick={this.toggleInfo} />
      </div>
      <Info open={this.state.info} toggle={this.toggleInfo} />
    </Fragment>
  );
}

export default Mobile;
