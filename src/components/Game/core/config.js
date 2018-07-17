export default {
  tickrate: 33,
  arenaRadius: 5000,

  reconciliationThreshold: 10, // max position disparity between client and server

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
