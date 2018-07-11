import React, { Component, Fragment } from 'react';
import _ from 'lodash';

import Start from './Start';
import RoomModalContainer from './RoomModal/RoomModalContainer';
import { pack } from '../../services/cereal';

class StartContainer extends Component {
  state = {
    nickname: '',
    audio: true,
    modal: false,
  }

  handleNameChange = event => {
    this.setState({ nickname: event.target.value });
  }

  toggleAudio = () => {
    this.setState(prevState => ({ audio: !prevState.audio }));
  }

  toggleModal = () => {
    this.setState(prevState => ({ modal: !prevState.modal }));
  }

  joinGame = event => {
    event.preventDefault();
    this.props.socket.send(pack({ _: 'joinGame', nickname: _.trim(this.state.nickname) }));
    this.setState({ nickname: '' });
  }

  render = () => (
    <Fragment>
      <Start nickname={this.state.nickname} handleNameChange={this.handleNameChange}
        audio={this.state.audio} toggleAudio={this.toggleAudio} toggleModal={this.toggleModal}
        joinGame={this.joinGame} />
      <RoomModalContainer socket={this.props.socket} modal={this.state.modal}
        toggleModal={this.toggleModal} />
    </Fragment>
  );
}

export default StartContainer;
