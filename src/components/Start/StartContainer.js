import React, { Component } from 'react';
import _ from 'lodash';

import Start from './Start';

class StartContainer extends Component {
  state = {
    name: '',
    modalOpen: false,
  };

  handleNameChange = e => this.setState({ name: e.target.value });

  handleSubmit = e => {
    e.preventDefault();
    this.props.socket.emit('joinGame', _.trim(this.state.name));
    this.setState({ name: '' });
  }

  toggleModal = () => this.setState(prevState => ({ modalOpen: !prevState.modalOpen }));

  render = () => (
    <Start socket={this.props.socket}
      name={this.state.name} handleNameChange={this.handleNameChange}
      handleSubmit={this.handleSubmit}
      room={this.props.room}
      toggleModal={this.toggleModal} modalOpen={this.state.modalOpen}
      toggleAudio={this.props.toggleAudio} audio={this.props.audio}
    />
  );
}

export default StartContainer;
