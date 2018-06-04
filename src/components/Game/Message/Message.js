import React, { Component } from 'react';

import './Message.css';

class Message extends Component {
  state = {
    message: {},
    showing: false,
  }

  componentDidMount() {
    this.props.socket.on('message', message => {
      if (message.type === 'clear' && this.state.message.type === message.target) {
        this.setState({ message: '', showing: false });
      } else if (message.type !== 'clear') {
        this.setState({ message, showing: true });

        if (message.duration) {
          window.setTimeout(() => {
            this.setState({ showing: false });
          }, message.duration * 1000);
        }
      }
    });
  }

  componentWillUnmount() {
    this.props.socket.off('message');
  }

  render = () => {
    const { message, showing } = this.state;
    if (!showing) return null;

    return (
      <div className="msg">{
        message.type === 'kill' ? (
          <span>You killed <span className="msg__name">{message.name}</span></span>
        ) : (
          <span>{message.msg}</span>
        )
      }</div>
    );
  };
}

export default Message;
