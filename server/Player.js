const _ = require('lodash');

const config = require('./config');
const { getDistance } = require('./util');

class Spear {
  constructor(posx, posy) {
    this.pos = {
      x: posx,
      y: posy,
    };
  }
}

class Player {
  constructor(id, name, room) {
    this.id = id;
    this.name = name;
    this.room = room;
    this.health = 80;
    this.shield = 80;
    this.direction = 90;

    // random initial position within the arena (a circle)
    // origin is at the center of the arena
    const randomAngle = _.random(2 * Math.PI);
    const randomDistance = _.random(config.arenaRadius ** 2);
    this.pos = {
      x: Math.sqrt(randomDistance) * Math.cos(randomAngle),
      y: Math.sqrt(randomDistance) * Math.sin(randomAngle),
    };

    this.spear = new Spear(this.pos.x + 62.5, this.pos.y);
  }

  move(target) {
    const distance = getDistance(this.pos.x, target.x, this.pos.y, target.y);
    const direction = Math.atan2(distance.y, distance.x);

    // set this player's direction in degrees
    this.direction = direction * (180 / Math.PI);

    let dx = 4 * Math.cos(direction);
    let dy = 4 * Math.sin(direction);

    if (distance.total < 100) {
      dx *= distance.total / 100;
      dy *= distance.total / 100;
    }

    this.pos.x += dx;
    this.pos.y += dy;

    // determine position of the spear (62.5 away from the player)
    const angleToSpear = (direction + (Math.PI / 2));
    this.spear.pos.x = this.pos.x + (62.5 * Math.cos(angleToSpear));
    this.spear.pos.y = this.pos.y + (62.5 * Math.sin(angleToSpear));
  }
}

module.exports = Player;
