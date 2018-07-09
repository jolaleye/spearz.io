import React from 'react';

import './Message.css';

const Message = ({ message }) => {
  if (message.type === 'bounds') {
    return (
      <div className="message bounds">
        <span>{message.msg}</span>
      </div>
    );
  }

  return null;
};

export default Message;
