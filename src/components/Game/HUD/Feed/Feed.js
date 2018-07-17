import React from 'react';

import './Feed.css';

const Feed = ({ feed }) => (
  <div className="feed">{
    feed.map((item, i) => (
      <div className="feed__item" key={i}>{item}</div>
    ))
  }</div>
);

export default Feed;
