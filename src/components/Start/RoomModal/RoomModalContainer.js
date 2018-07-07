import React, { Component } from 'react';

import RoomModal from './RoomModal';

class RoomModalContainer extends Component {
  state = {
    roomKey: '',
  }

  handleKeyChange = event => {
    this.setState({ roomKey: event.target.value });
  }

  render = () =>
    <RoomModal modal={this.props.modal} toggleModal={this.props.toggleModal}
      currentKey={this.props.currentKey} roomKey={this.state.key}
      handleKeyChange={this.handleKeyChange} />
}

export default RoomModalContainer;
