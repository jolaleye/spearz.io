import React from 'react';

import './Status.css';

const Status = ({ health, shield }) => (
  <div className="status">
    <progress className="status__bar status__shield progress is-small" value={shield} max="100" />
    <progress className="status__bar status__health progress is-small" value={health} max="100" />
  </div>
);

export default Status;
