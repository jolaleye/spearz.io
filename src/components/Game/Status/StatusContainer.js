import React, { Component } from 'react';

import Status from './Status';

class StatusContainer extends Component {
  state = {
    health: 100,
  }

  componentDidMount() {
    this.props.socket.on('health', health => this.setState({ health }));
  }

  componentWillUnmount() {
    this.props.socket.off('health');
  }

  render = () => <Status health={this.state.health} />;
}

export default StatusContainer;
