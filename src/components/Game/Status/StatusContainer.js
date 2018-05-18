import React, { Component } from 'react';

import Status from './Status';

class StatusContainer extends Component {
  render = () => <Status health={80} shield={35} />;
}

export default StatusContainer;
