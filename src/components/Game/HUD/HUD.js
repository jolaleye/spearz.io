import React, { Component, Fragment } from 'react';

import { unpack } from '../../../services/cereal';
import Message from './Message/Message';
import Death from './Death/Death';

class HUD extends Component {
  state = {
    message: false,
    dead: false,
  }

  componentDidMount() {
    this.props.socket.addEventListener('message', packet => {
      const data = unpack(packet.data);
      switch (data._) {
        case 'message':
          if (!data.type) return;
          this.showMessage(data.type);
          break;

        case 'clearMessage':
          if (!data.type) return;
          this.clearMessage(data.type);
          break;

        case 'dead':
          if (!data.from) return;
          this.showDeathOverlay(data.from, data.name);
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

  showDeathOverlay = (from, name) => {
    let msg;
    if (from === 'bounds') msg = 'You were out of bounds... (－‸ლ)';

    this.setState({ dead: { from, msg, name } });

    setTimeout(() => this.props.changeMode('start'), 3000);
  }

  render = () => (
    this.state.dead ? (
      <Death dead={this.state.dead} />
    ) : (
      <Fragment>
        {this.state.message ? <Message message={this.state.message} /> : null}
      </Fragment>
    )
  );
}

export default HUD;
