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
      const message = decode(data);
      if (message._type === 'health') this.setState({ health: message.health });
    });
  }

  render = () => <Status health={this.state.health} />;
}

export default StatusContainer;
