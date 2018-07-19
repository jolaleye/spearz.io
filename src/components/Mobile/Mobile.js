import React from 'react';

import './Mobile.css';
import logo from '../../assets/logo.svg';

const Mobile = () => (
  <div className="mobile is-hidden-desktop">
    <span>Please move to a larger device to play :)</span>
    <img src={logo} alt="spearz.io"/>
  </div>
);

export default Mobile;
