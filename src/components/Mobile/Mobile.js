import React from 'react';

import './Mobile.css';
import logo from '../../assets/logo.svg';

const Mobile = () => (
  <div className="mobile">
    <div className="content">
      <p>Please move to a larger device to play</p>
    </div>
    <img className="logo" src={logo} alt="Spearz.io" />
  </div>
);

export default Mobile;
