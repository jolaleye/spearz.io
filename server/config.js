module.exports = {
  tickrate: 33,
  snapshotRate: 50,
  leaderboardRate: 750,
  arenaRadius: 5000,
  playerLimit: 100,
  pingRate: 1000,
  minimapRate: 1700,

  damage: {
    bounds: 10,
    boundsFreq: 750,
    hit: 30,
  },

  score: {
    kill: 100,
    pickup: 10,
  },

  player: {
    speed: 16,
    regen: {
      wait: 5000,
      amount: 1,
      freq: 300,
    },
    expiration: 4000,
  },

  spear: {
    cooldown: 500,
    distFromPlayer: 55,
    throwSpeed: 50,
    throwAngleDivisor: 38, // increasing this makes the spear follow a straighter path
  },

  pickups: {
    initialCount: 50,
    onJoin: 10,
    max: 200,
  },

  bots: {
    enabled: true,
    count: 5, // bots fill space up to 5 spots
  },
};
