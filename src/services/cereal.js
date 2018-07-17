import sp from 'schemapack';

sp.setStringEncoding('ascii');
sp.addTypeAlias('uint', 'varuint');
sp.addTypeAlias('int', 'varint');

const lexicon = {
  0: {
    type: 'id',
    schema: sp.build({ _: 'uint', id: 'string' }),
  },
  1: {
    type: 'roomKey',
    schema: sp.build({ _: 'uint', key: 'string' }),
  },
  2: {
    type: 'joinRoom',
    schema: sp.build({ _: 'uint', key: 'string' }),
  },
  3: {
    type: 'keyMsg',
    schema: sp.build({ _: 'uint', code: 'uint', msg: 'string' }),
  },
  4: {
    type: 'joinGame',
    schema: sp.build({ _: 'uint', nickname: 'string' }),
  },
  5: {
    type: 'ready',
    schema: sp.build({ _: 'uint' }),
  },
  6: {
    type: 'snapshot',
    schema: sp.build({
      _: 'uint',
      timestamp: 'string',
      last: 'uint',
      players: [{
        id: 'string',
        name: 'string',
        health: 'uint',
        dead: 'bool',
        pos: { x: 'float64', y: 'float64' },
        quick: 'bool',
        direction: 'float64',
        released: 'bool',
        spear: {
          pos: { x: 'float64', y: 'float64' },
          direction: 'float64',
        },
      }],
    }),
  },
  7: {
    type: 'leaderboard',
    schema: sp.build({
      _: 'uint',
      players: [{
        id: 'string',
        name: 'string',
        score: 'uint',
        rank: 'uint',
      }],
    }),
  },
  8: {
    type: 'target',
    schema: sp.build({
      _: 'uint',
      target: { x: 'float64', y: 'float64' },
      tick: 'uint',
    }),
  },
  9: {
    type: 'throw',
    schema: sp.build({ _: 'uint' }),
  },
  10: {
    type: 'hit',
    schema: sp.build({ _: 'uint' }),
  },
  11: {
    type: 'kill',
    schema: sp.build({ _: 'uint', name: 'string' }),
  },
  12: {
    type: 'message',
    schema: sp.build({ _: 'uint', type: 'string' }),
  },
  13: {
    type: 'clearMessage',
    schema: sp.build({ _: 'uint', type: 'string' }),
  },
  14: {
    type: 'dead',
    schema: sp.build({ _: 'uint', from: 'string', name: 'string' }),
  },
  15: {
    type: 'remove',
    schema: sp.build({ _: 'uint' }),
  },
  16: {
    type: 'feed',
    schema: sp.build({ _: 'uint', type: 'string', names: ['string'] }),
  },
  17: {
    type: 'score',
    schema: sp.build({ _: 'uint', value: 'uint' }),
  },
};

export const pack = (type, data = {}) => {
  const typeCode = Object.keys(lexicon).find(key => lexicon[key].type === type);
  const { schema } = lexicon[typeCode];

  return schema.encode({ _: Number(typeCode), ...data });
};

export const unpack = packet => {
  const typeCode = new Uint8Array(packet)[0];
  const { schema } = lexicon[typeCode];

  const data = schema.decode(packet);
  return { ...data, _: lexicon[typeCode].type };
};
