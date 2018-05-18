const _ = require('lodash');

const config = require('./config');

class Player {
  constructor(id, name, room) {
    this.id = id;
    this.name = name;
    this.room = room;
    // random initial position within the arena (a circle)
    // origin is at the center of the arena
    const randomAngle = _.random(2 * Math.PI);
    const randomDistance = _.random(config.arenaRadius ** 2);
    this.pos = {
      x: Math.sqrt(randomDistance) * Math.cos(randomAngle),
      y: Math.sqrt(randomDistance) * Math.sin(randomAngle),
    };
  }
}

module.exports = Player;
