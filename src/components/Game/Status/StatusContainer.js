import React, { Component } from 'react';

import parser from '../../../services/parser';
import Status from './Status';

const { decode } = parser;

class StatusContainer extends Component {
  state = {
    health: 100,
  }

  componentDidMount() {
    this.props.socket.addEventListener('message', ({ data }) => {
      const packet = decode(data);
      if (packet._type === 'health') this.setState({ health: packet.health });
    });
  }

  render = () => <Status health={this.state.health} />;
}

export default StatusContainer;
