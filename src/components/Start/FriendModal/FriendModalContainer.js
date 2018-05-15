import React, { Component } from 'react';

import FriendModal from './FriendModal';

class FriendModalContainer extends Component {
  state = { roomCode: '' };

  handleCodeChange = e => this.setState({ roomCode: e.target.value });

  joinRoom = e => {
    e.preventDefault();

    const { roomCode } = this.state;
    if (roomCode && roomCode.length === 9) {
      this.props.joinRoom(roomCode);
      this.setState({ roomCode: '' });
    }
  }

  render = () => {
    const { active, toggle, room } = this.props;

    return (
      <FriendModal active={active} toggle={toggle} room={room} joinRoom={this.joinRoom}
        handleCodeChange={this.handleCodeChange} codeValue={this.state.roomCode}
      />
    );
  };
}

export default FriendModalContainer;
