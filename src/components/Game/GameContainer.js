import React, { Component } from 'react';

import Game from './Game';

class GameContainer extends Component {
  render = () => <Game socket={this.props.socket} />;
}

export default GameContainer;
