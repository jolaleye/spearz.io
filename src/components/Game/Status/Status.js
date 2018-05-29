import React from 'react';

import './Status.css';

const Status = ({ health }) => (
  <div className="status">
    <progress className="status__bar status__health progress is-small" value={health} max="100" />
  </div>
);

export default Status;
