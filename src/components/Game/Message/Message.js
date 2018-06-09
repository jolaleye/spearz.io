import React, { Component } from 'react';

import './Message.css';
import parser from '../../../services/parser';

const { decode } = parser;

class Message extends Component {
  state = {
    message: {},
    showing: false,
  }

  componentDidMount() {
    this.props.socket.addEventListener('message', ({ data }) => {
      const packet = decode(data);
      if (packet._type !== 'message') return;

      if (packet.type === 'clear' && this.state.message.type === packet.target) {
        this.setState({ message: '', showing: false });
      } else if (packet.type !== 'clear') {
        this.setState({ message: packet, showing: true });

        if (packet.duration > 0) {
          window.setTimeout(() => {
            this.setState({ showing: false });
          }, packet.duration * 1000);
        }
      }
    });
  }

  render = () => {
    const { message, showing } = this.state;
    if (!showing) return null;

    return (
      <div className="msg">{
        message.type === 'kill' ? (
          <span>You killed <span className="msg__name">{message.msg}</span></span>
        ) : (
          <span>{message.msg}</span>
        )
      }</div>
    );
  };
}

export default Message;
