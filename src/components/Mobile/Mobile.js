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
      <div className="mobile is-hidden-desktop">
        <span>Please move to a larger device to play :)</span>
        <img src={logo} alt="spearz.io"/>
        <InfoIcon className="icon" onClick={this.toggleInfo} />
      </div>
      <Info open={this.state.info} toggle={this.toggleInfo} />
    </Fragment>
  );
}

export default Mobile;
