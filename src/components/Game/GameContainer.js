import React, { Component } from 'react';

import Game from './Game';

class GameContainer extends Component {
  render = () => <Game socket={this.props.socket} assets={this.props.assets} />;
}

export default GameContainer;
