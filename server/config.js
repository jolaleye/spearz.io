module.exports = {
  port: process.env.NODE_ENV === 'production' ? process.env.PORT : 3001,
  tickrate: 15,
  snapshotRate: 50,
  arenaRadius: 5000,
  playerLimit: 100,
};
