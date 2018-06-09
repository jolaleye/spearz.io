const sp = require('schemapack');

exports.id = sp.build({
  _type: 'uint8',
  id: 'string',
});

exports.roomId = sp.build({
  _type: 'uint8',
  id: 'string',
});

exports.joinRoom = sp.build({
  _type: 'uint8',
  id: 'string',
});

exports.invalidRoom = sp.build({
  _type: 'uint8',
  reason: 'string',
});

exports.joinGame = sp.build({
  _type: 'uint8',
  name: 'string',
});

exports.ready = sp.build({
  _type: 'uint8',
});

exports.requestUpdate = sp.build({
  _type: 'uint8',
  target: { x: 'float64', y: 'float64' },
});

exports.update = sp.build({
  _type: 'uint8',
  players: [{
    id: 'string',
    name: 'string',
    pos: { x: 'float64', y: 'float64' },
    spear: { direction: 'float64' },
    distanceToSpear: { x: 'float64', y: 'float64', total: 'float64' },
    direction: 'float64',
    outOfBounds: { at: 'float64', time: 'float64' },
    thrown: 'boolean',
    quick: 'boolean',
    dead: 'boolean',
  }],
});

exports.leaderboard = sp.build({
  _type: 'uint8',
  leaderboard: [
    { name: 'string', score: 'varuint', rank: 'varuint', active: 'boolean' },
  ],
});

exports.throw = sp.build({
  _type: 'uint8',
  target: { x: 'float64', y: 'float64' },
});

exports.hit = sp.build({
  _type: 'uint8',
});

exports.removePlayer = sp.build({
  _type: 'uint8',
});

exports.dead = sp.build({
  _type: 'uint8',
  type: 'string',
  name: 'string',
});

exports.health = sp.build({
  _type: 'uint8',
  health: 'uint8',
});

exports.message = sp.build({
  _type: 'uint8',
  type: 'string',
  target: 'string',
  duration: 'uint8',
  msg: 'string',
});
