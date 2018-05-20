import React, { Component } from 'react';

import Status from './Status';

class StatusContainer extends Component {
  state = {
    health: 0,
    shield: 0,
  }

  componentDidMount() {
    this.props.socket.on('status', status => {
      this.setState({
        health: status.health,
        shield: status.shield,
      });
    });
  }

  render = () => <Status health={this.state.health} shield={this.state.shield} />;
}

export default StatusContainer;
