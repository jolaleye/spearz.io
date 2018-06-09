import React, { Component } from 'react';

import parser from '../../../services/parser';
import FriendModal from './FriendModal';

const { encode, decode } = parser;

class FriendModalContainer extends Component {
  state = {
    roomCode: '',
    invalid: false,
  };

  componentDidMount() {
    this.props.socket.addEventListener('message', ({ data }) => {
      const packet = decode(data);
      if (packet._type === 'invalidRoom') this.setState({ invalid: packet.reason });
    });
  }

  handleCodeChange = e => this.setState({ roomCode: e.target.value });

  joinRoom = e => {
    const { roomCode } = this.state;
    e.preventDefault();

    if (roomCode) {
      this.props.socket.send(encode('joinRoom', { id: roomCode }));
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
