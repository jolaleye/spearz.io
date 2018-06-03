import React, { Component } from 'react';
import _ from 'lodash';
import { Howler } from 'howler';

import Start from './Start';
import FriendModalContainer from './FriendModal/FriendModalContainer';

class StartContainer extends Component {
  state = {
    name: '',
    friendModalState: false,
    audio: true,
  };

  handleNameChange = e => this.setState({ name: e.target.value });

  handleSubmit = e => {
    e.preventDefault();
    this.props.socket.emit('joinGame', _.trim(this.state.name));
    this.setState({ name: '' });
  }

  toggleModal = () => {
    this.setState(prevState => ({ friendModalState: !prevState.friendModalState }));
  }

  toggleAudio = async () => {
    await this.setState(prevState => ({ audio: !prevState.audio }));
    Howler.mute(!this.state.audio);
  }

  render = () => (
    <Start name={this.state.name} handleNameChange={this.handleNameChange}
      handleSubmit={this.handleSubmit} toggleAudio={this.toggleAudio} audio={this.state.audio}
      toggleModal={this.toggleModal}
    >
      <FriendModalContainer socket={this.props.socket} room={this.props.room}
        toggleModal={this.toggleModal} modalState={this.state.friendModalState}
      />
    </Start>
  );
}

export default StartContainer;
