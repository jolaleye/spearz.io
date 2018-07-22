module.exports = {
  tickrate: 33,
  snapshotRate: 50,
  leaderboardRate: 750,
  arenaRadius: 5000,
  playerLimit: 100,

  damage: {
    bounds: 10,
    boundsFreq: 750,
    hit: 20,
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

  scorePickups: {
    initialCount: 100,
    onJoin: 3,
  },

  bots: {
    count: 5,
    keepUntil: 5,
  },
};
