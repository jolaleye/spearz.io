import React, { Component } from 'react';

import parser from '.././../../services/parser';
import Leaderboard from './Leaderboard';

const { decode } = parser;

class LeaderboardContainer extends Component {
  state = {
    leaderboard: [],
  }

  componentDidMount() {
    this.props.socket.addEventListener('message', ({ data }) => {
      const message = decode(data);
      if (message._type === 'leaderboard') this.setState({ leaderboard: message.leaderboard });
    });
  }

  render = () => <Leaderboard leaders={this.state.leaderboard} />;
}

export default LeaderboardContainer;
