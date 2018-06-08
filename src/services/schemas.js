import sp from 'schemapack';

const schemas = {};

schemas.id = sp.build({
  _type: 'uint8',
  id: 'string',
});

schemas.roomId = sp.build({
  _type: 'uint8',
  id: 'string',
});

schemas.joinRoom = sp.build({
  _type: 'uint8',
  id: 'string',
});

schemas.invalidRoom = sp.build({
  _type: 'uint8',
  reason: 'string',
});

schemas.joinGame = sp.build({
  _type: 'uint8',
  name: 'string',
});

schemas.ready = sp.build({
  _type: 'uint8',
});

schemas.requestUpdate = sp.build({
  _type: 'uint8',
  target: { x: 'float64', y: 'float64' },
});

schemas.update = sp.build({
  _type: 'uint8',
  player: {
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
  },
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

schemas.leaderboard = sp.build({
  _type: 'uint8',
  leaderboard: [
    { name: 'string', score: 'varuint', rank: 'varuint', active: 'boolean' },
  ],
});

schemas.throw = sp.build({
  _type: 'uint8',
  target: { x: 'float64', y: 'float64' },
});

schemas.hit = sp.build({
  _type: 'uint8',
});

schemas.removePlayer = sp.build({
  _type: 'uint8',
});

schemas.dead = sp.build({
  _type: 'uint8',
  type: 'string',
  name: 'string',
});

schemas.health = sp.build({
  _type: 'uint8',
  health: 'uint8',
});

schemas.message = sp.build({
  _type: 'uint8',
  type: 'string',
  target: 'string',
  duration: 'uint8',
  msg: 'string',
});

export default schemas;
