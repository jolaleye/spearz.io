import React, { Component } from 'react';

import FriendModal from './FriendModal';

class FriendModalContainer extends Component {
  state = {
    roomCode: '',
    invalid: false,
  };

  componentDidMount() {
    this.props.socket.on('invalidRoom', reason => this.setState({ invalid: reason }));
  }

  componentWillUnmount() {
    this.props.socket.off('invalidRoom');
  }

  handleCodeChange = e => this.setState({ roomCode: e.target.value });

  joinRoom = e => {
    const { roomCode } = this.state;
    e.preventDefault();

    if (roomCode) {
      this.props.socket.emit('joinRoom', roomCode);
      this.setState({ roomCode: '', invalid: false });
    }
  }

  render = () => {
    const { modalState, toggleModal, room } = this.props;

    return (
      <FriendModal active={modalState} toggle={toggleModal}
        invalid={this.state.invalid} room={room} joinRoom={this.joinRoom}
        handleCodeChange={this.handleCodeChange} codeValue={this.state.roomCode}
      />
    );
  };
}

export default FriendModalContainer;
