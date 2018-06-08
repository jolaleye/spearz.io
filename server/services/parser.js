const schemas = require('./schemas');

const TYPES = {
  0: 'id',
  1: 'roomId',
  2: 'joinRoom',
  3: 'invalidRoom',
  4: 'joinGame',
  5: 'ready',
  6: 'requestUpdate',
  7: 'update',
  8: 'leaderboard',
  9: 'throw',
  10: 'hit',
  11: 'removePlayer',
  12: 'dead',
  13: 'health',
  14: 'message',
};

class Parser {
  encode(type, data) {
    const typeCode = Number(Object.keys(TYPES).find(key => TYPES[key] === type));
    const schema = schemas[type];

    return schema.encode({
      _type: typeCode,
      ...data,
    });
  }

  decode(buffer) {
    const typeCode = new Uint8Array(buffer)[0];
    const schema = schemas[TYPES[typeCode]];

    const data = schema.decode(buffer);
    data._type = TYPES[data._type];
    return data;
  }
}

module.exports = new Parser();

/* eslint class-methods-use-this: off */
/* eslint no-underscore-dangle: off */
