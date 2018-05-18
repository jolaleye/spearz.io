import React from 'react';

import './Status.css';

const Status = ({ health, shield }) => (
  <div className="status">
    <progress className="status__bar progress is-primary" value={shield} max="100" />
    <progress className="status__bar progress is-danger" value={health} max="100" />
  </div>
);

export default Status;
