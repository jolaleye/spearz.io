import React, { Component } from 'react';
import _ from 'lodash';

import './Message.css';

class Message extends Component {
  state = {
    message: false,
  }

  componentDidMount() {
    this.props.socket.on('message', message => {
      if (!_.isEqual(message, this.state.message)) this.setState({ message });
    });

    this.props.socket.on('clearMessage', () => {
      if (this.state.message) this.setState({ message: false });
    });
  }

  componentWillUnmount() {
    this.props.socket.off('message');
    this.props.socket.off('clearMessage');
  }

  render = () => {
    const { message } = this.state;

    return message ? (
      <div className="msg">
        <span>{message.msg}</span>
        {message.type === 'kill' ? <span className="msg__name">{message.name}</span> : null}
      </div>
    ) : null;
  };
}

export default Message;
