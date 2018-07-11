module.exports = {
  port: process.env.NODE_ENV === 'production' ? process.env.PORT : 3001,

  tickrate: 15,
  snapshotRate: 50,
  leaderboardRate: 1000,
  arenaRadius: 5000,
  playerLimit: 100,

  spearCooldown: 500,

  boundaryDamage: 10,
  boundaryDamageFrequency: 1000,
  hitDamage: 20,

  killScore: 100,
};
