import React, { Component } from 'react';

import Start from './Start';

class StartContainer extends Component {
  state = {
    name: '',
    modalOpen: false,
  };

  handleNameChange = e => this.setState({ name: e.target.value });

  handleSubmit = e => {
    e.preventDefault();
    this.setState({ name: '' });
  }

  toggleModal = () => this.setState(prevState => ({ modalOpen: !prevState.modalOpen }));

  joinRoom = id => this.props.socket.emit('joinRoom', id);

  render = () => (
    <Start name={this.state.name} handleNameChange={this.handleNameChange}
      handleSubmit={this.handleSubmit}
      room={this.props.room} joinRoom={this.joinRoom}
      toggleModal={this.toggleModal} modalOpen={this.state.modalOpen}
    />
  );
}

export default StartContainer;
