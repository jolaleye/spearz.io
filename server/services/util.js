const _ = require('lodash');

exports.ID = (chunks = 1) => {
  // generate an id chunk
  const chunk = () => Math.random().toString(36).substr(2, 9);

  let id = '';

  // add chunks to the id
  _.times(chunks, i => {
    // add a "-" after each chunk unless it's the last
    id += `${chunk()}${i === chunks - 1 ? '' : '-'}`;
  });

  return id;
};

exports.getDistance = (x1, x2, y1, y2) => ({
  x: x2 - x1,
  y: y2 - y1,
  total: Math.sqrt(((x2 - x1) ** 2) + ((y2 - y1) ** 2)),
});

exports.lerp = (v0, v1, t) => (
  ((1 - t) * v0) + (t * v1)
);
