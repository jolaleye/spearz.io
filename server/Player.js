const _ = require('lodash');

const config = require('./config');
const { getDistance } = require('./services/util');

class Player {
  constructor(id, nickname) {
    this.id = id;
    this.name = nickname;

    // random initial position within the circular arena with origin (0,0)
    const randomAngle = _.random(2 * Math.PI);
    const randomDistance = _.random(config.arenaRadius ** 2);
    this.pos = {
      x: Math.sqrt(randomDistance) * Math.cos(randomAngle),
      y: Math.sqrt(randomDistance) * Math.sin(randomAngle),
    };

    this.direction = 0;
  }

  move(target) {
    const distance = getDistance(this.pos.x, target.x, this.pos.y, target.y);
    this.direction = Math.atan2(distance.y, distance.x);

    let dx = 5 * Math.cos(this.direction);
    let dy = 5 * Math.sin(this.direction);

    // movement is slower when the target is closer
    if (distance.total < 100) {
      dx *= distance.total / 100;
      dy *= distance.total / 100;
    }

    this.pos.x += dx;
    this.pos.y += dy;
  }
}

module.exports = Player;
