const _ = require('lodash');

const config = require('./config');
const { getDistance } = require('./util');

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

  move(target) {
    const distance = getDistance(this.pos.x, target.x, this.pos.y, target.y);
    const direction = Math.atan2(distance.y, distance.x);

    let dx = 5 * Math.cos(direction);
    let dy = 5 * Math.sin(direction);

    if (distance.total < 100) {
      dx *= distance.total / 100;
      dy *= distance.total / 100;
    }

    this.pos.x += dx;
    this.pos.y += dy;
  }
}

module.exports = Player;
