export default {
  tickrate: 15,
  arenaRadius: 5000,

  reconciliationThreshold: 15, // max position disparity between client and server

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
