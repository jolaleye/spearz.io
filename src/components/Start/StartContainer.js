import React, { Component, Fragment } from 'react';

import Start from './Start';
import RoomModalContainer from './RoomModal/RoomModalContainer';
import Info from '../Info/Info';

class StartContainer extends Component {
  state = {
    modal: false,
    info: false,
    privacy: false,
  }

  toggleModal = () => {
    this.setState(prevState => ({ modal: !prevState.modal }));
  }

  toggleInfo = () => {
    this.setState(prevState => ({ info: !prevState.info }));
  }

  togglePrivacy = () => {
    this.setState(prevState => ({ privacy: !prevState.privacy }));
  }

  render = () => (
    <Fragment>
      <Start ready={this.props.ready} nickname={this.props.nickname}
        handleNameChange={this.props.handleNameChange} audio={this.props.audio}
        toggleAudio={this.props.toggleAudio} toggleModal={this.toggleModal}
        toggleInfo={this.toggleInfo} joinGame={this.props.joinGame}
        privacy={this.state.privacy} togglePrivacy={this.togglePrivacy} />
      {this.props.ready
        ? <RoomModalContainer socket={this.props.socket} modal={this.state.modal}
            toggleModal={this.toggleModal} roomKey={this.props.roomKey} />
        : null
      }
      <Info open={this.state.info} toggle={this.toggleInfo} />
    </Fragment>
  );
}

export default StartContainer;
