import React, { Component, Fragment } from 'react';
import _ from 'lodash';
import { Howler } from 'howler';

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

  toggleAudio = async () => {
    await this.setState(prevState => ({ audio: !prevState.audio }));
    Howler.mute(!this.state.audio);
  }

  toggleModal = () => {
    this.setState(prevState => ({ modal: !prevState.modal }));
  }

  joinGame = event => {
    event.preventDefault();
    if (!this.props.connected || !this.props.loaded) return;

    this.props.socket.send(pack('joinGame', { nickname: _.trim(this.state.nickname) }));
    this.setState({ nickname: '' });
  }

  render = () => (
    <Fragment>
      <Start connected={this.props.connected} loaded={this.props.loaded}
        nickname={this.state.nickname} handleNameChange={this.handleNameChange}
        audio={this.state.audio} toggleAudio={this.toggleAudio} toggleModal={this.toggleModal}
        joinGame={this.joinGame} />
      {this.props.connected
        ? <RoomModalContainer socket={this.props.socket} modal={this.state.modal}
            toggleModal={this.toggleModal} roomKey={this.props.roomKey} />
        : null
      }
    </Fragment>
  );
}

export default StartContainer;
