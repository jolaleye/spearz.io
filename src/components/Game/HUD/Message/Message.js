import React from 'react';

import './Message.css';

const Message = ({ message }) => {
  switch (message.type) {
    case 'deathByBounds':
      return (
        <div className="message death bounds">
          <span>{message.msg}</span>
        </div>
      );

    case 'deathByPlayer':
      return (
        <div className="message death player">
          <span>Killed by</span>
          <span className="name">{message.name}</span>
        </div>
      );

    case 'bounds':
      return (
        <div className="message boundary">
          <span>{message.msg}</span>
        </div>
      );

    case 'kill':
      return (
        <div className="message kill">
          <span>You killed</span>
          <span className="name">{message.name}</span>
        </div>
      );

    default: return null;
  }
};

export default Message;
