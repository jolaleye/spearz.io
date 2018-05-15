import React, { Component } from 'react';

import FriendModal from './FriendModal';

class FriendModalContainer extends Component {
  state = {
    roomCode: '',
    invalid: false,
  };

  componentDidUpdate() {
    if (this.props.socket) {
      this.props.socket.on('invalidRoom', () => this.setState({ invalid: true }));
    }
  }

  handleCodeChange = e => this.setState({ roomCode: e.target.value });

  joinRoom = e => {
    e.preventDefault();

    const { roomCode } = this.state;
    if (roomCode) {
      this.props.socket.emit('joinRoom', roomCode);
      this.setState({ roomCode: '', invalid: false });
    }
  }

  render = () => {
    const { active, toggle, room } = this.props;

    return (
      <FriendModal active={active} toggle={toggle}
        invalid={this.state.invalid} room={room} joinRoom={this.joinRoom}
        handleCodeChange={this.handleCodeChange} codeValue={this.state.roomCode}
      />
    );
  };
}

export default FriendModalContainer;
