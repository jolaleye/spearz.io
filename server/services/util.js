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
