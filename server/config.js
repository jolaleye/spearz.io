module.exports = {
  tickrate: 15,
  snapshotRate: 50,
  leaderboardRate: 1000,
  arenaRadius: 5000,
  playerLimit: 100,

  damage: {
    bounds: 10,
    boundsFreq: 500,
    hit: 20,
  },

  score: {
    kill: 100,
  },

  player: {
    speed: 8,
  },

  spear: {
    cooldown: 500,
    distFromPlayer: 55,
    throwSpeed: 27,
    throwAngleDivisor: 38, // increasing this makes the spear follow a straighter path
  },
};
