module.exports = {
  tickrate: 33,
  snapshotRate: 50,
  leaderboardRate: 1000,
  arenaRadius: 5000,
  playerLimit: 100,

  damage: {
    bounds: 10,
    boundsFreq: 750,
    hit: 20,
  },

  score: {
    kill: 100,
  },

  player: {
    speed: 16,
  },

  spear: {
    cooldown: 500,
    distFromPlayer: 55,
    throwSpeed: 50,
    throwAngleDivisor: 38, // increasing this makes the spear follow a straighter path
  },
};
