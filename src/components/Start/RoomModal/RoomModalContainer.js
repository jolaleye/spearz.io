import React, { Component } from 'react';

import RoomModal from './RoomModal';
import { unpack, pack } from '../../../services/cereal';

class RoomModalContainer extends Component {
  state = {
    currentKey: '',
    roomKey: '',
    msg: null,
  }

  componentDidMount() {
    this.props.socket.addEventListener('message', packet => {
      const data = unpack(packet.data);
      if (data._ === 'roomKey') {
        this.setState({ currentKey: data.key });
      }

      if (data._ === 'keyMsg') {
        this.setState({ msg: { code: data.code, msg: data.msg } });
      }
    });
  }

  joinRoom = event => {
    event.preventDefault();
    this.props.socket.send(pack({ _: 'joinRoom', key: this.state.roomKey }));
    this.setState({ roomKey: '' });
  }

  handleKeyChange = event => {
    if (this.state.msg) this.setState({ msg: null });
    this.setState({ roomKey: event.target.value });
  }

  render = () =>
    <RoomModal modal={this.props.modal} toggleModal={this.props.toggleModal}
      currentKey={this.state.currentKey} roomKey={this.state.roomKey} msg={this.state.msg}
      handleKeyChange={this.handleKeyChange} joinRoom={this.joinRoom} />
}

export default RoomModalContainer;
