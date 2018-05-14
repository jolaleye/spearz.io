import React, { Component } from 'react';

import Start from './Start';

class StartContainer extends Component {
  state = { name: '' };

  handleNameChange = e => this.setState({ name: e.target.value });

  handleSubmit = e => {
    e.preventDefault();
    this.setState({ name: '' });
  }

  render = () => (
    <Start name={this.state.name} handleNameChange={this.handleNameChange}
      handleSubmit={this.handleSubmit}
    />
  );
}

export default StartContainer;
