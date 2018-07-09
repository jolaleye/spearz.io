import React, { Component, Fragment } from 'react';

import { unpack } from '../../../services/cereal';
import Message from './Message/Message';

class HUD extends Component {
  state = {
    message: false,
  }

  componentDidMount() {
    this.props.socket.addEventListener('message', packet => {
      const data = unpack(packet.data);
      switch (data._) {
        case 'message':
          this.showMessage(data.type);
          break;

        case 'clearMessage':
          this.clearMessage(data.type);
          break;

        default: break;
      }
    });
  }

  showMessage = type => {
    let msg;
    if (type === 'bounds') msg = 'You\'re out of bounds!';

    this.setState({ message: { type, msg } });
  }

  clearMessage = type => {
    if (this.state.message && type === this.state.message.type) {
      this.setState({ message: false });
    }
  }

  render = () => (
    <Fragment>
      {this.state.message ? <Message message={this.state.message} /> : null}
    </Fragment>
  );
}

export default HUD;
