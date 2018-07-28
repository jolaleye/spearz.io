import React from 'react';

import './Changelog.css';

const Changelog = () => (
  <div className="changelog">
    <span className="changelog__header">Changelog</span>
    <ul className="releases">

      <li className="release">
        <div className="head">
          <span className="version">v1.0.0</span>  |  <span className="date">7.28.18</span>
        </div>
        <ul className="changes">
          <li className="change">
            <span role="img" aria-label="Party Popper">🎉 </span>
            Release
            <span role="img" aria-label="Party Popper"> 🎉</span>
          </li>
        </ul>
      </li>

    </ul>
  </div>
);

export default Changelog;
