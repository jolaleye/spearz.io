import React, { Component } from 'react';

import Status from './Status';

class StatusContainer extends Component {
  state = {
    health: 0,
  }

  componentDidMount() {
    this.props.socket.on('status', status => {
      if ((status.health !== this.state.health)) this.setState({ health: status.health });
    });
  }

  componentWillUnmount() {
    this.props.socket.off('status');
  }

  render = () => <Status health={this.state.health} />;
}

export default StatusContainer;
