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
          if (!data.type) return;
          this.showMessage(data.type);
          break;

        case 'clearMessage':
          if (!data.type) return;
          this.clearMessage(data.type);
          break;

        case 'dead':
          if (!data.from) return;
          this.showDeath(data.from, data.name);
          break;

        case 'kill':
          this.showKill(data.name);
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

  showKill = name => {
    // reset the message timer so that subsequent messages aren't cleared early
    clearTimeout(this.killMessageTimer);

    const killed = name === '' ? '<unnamed>' : name;
    this.setState({ message: { type: 'kill', name: killed } });

    // set a timer on the message
    this.killMessageTimer = setTimeout(() => {
      // if the message is still a kill message, clear it
      if (this.state.message.type === 'kill') {
        this.setState({ message: false });
      }
    }, 3000);
  }

  showDeath = (from, name) => {
    if (from === 'bounds') {
      this.setState({ message: {
        type: 'deathByBounds',
        msg: 'You were out of bounds... (－‸ლ)',
      } });
    } else if (from === 'player') {
      this.setState({ message: {
        type: 'deathByPlayer',
        name: name === '' ? '<unnamed>' : name,
      } });
    }

    // go back to the start screen
    setTimeout(() => this.props.changeMode('start'), 4000);
  }

  render = () => (
    <Fragment>
      {this.state.message ? <Message message={this.state.message} /> : null}
    </Fragment>
  );
}

export default HUD;
