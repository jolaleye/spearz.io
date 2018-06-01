import React, { Component } from 'react';
import _ from 'lodash';

import Leaderboard from './Leaderboard';

class LeaderboardContainer extends Component {
  state = {
    leaderboard: [],
  }

  componentDidMount() {
    this.props.socket.on('leaderboard', leaderboard => {
      if (!_.isEqual(leaderboard, this.state.leaderboard)) this.setState({ leaderboard });
    });
  }

  componentWillUnmount() {
    this.props.socket.off('leaderboard');
  }

  render = () => <Leaderboard leaders={this.state.leaderboard} />;
}

export default LeaderboardContainer;
