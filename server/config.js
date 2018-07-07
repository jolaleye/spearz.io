module.exports = {
  port: process.env.NODE_ENV === 'production' ? process.env.PORT : 3001,
  playerLimit: 100,
};
