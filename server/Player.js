const _ = require('lodash');

const config = require('./config');
const { getDistance } = require('./util');

class Spear {
  constructor(pos) {
    this.pos = {
      x: pos.x,
      y: pos.y,
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
    this.direction = 0;
    this.outOfBounds = false;

    // random initial position within the arena (a circle)
    // origin is at the center of the arena
    const randomAngle = _.random(2 * Math.PI);
    const randomDistance = _.random(config.arenaRadius ** 2);
    this.pos = {
      x: Math.sqrt(randomDistance) * Math.cos(randomAngle),
      y: Math.sqrt(randomDistance) * Math.sin(randomAngle),
    };

    this.spear = new Spear(this.pos);
  }

  move(target) {
    // distance and direction to the target
    const distance = getDistance(this.pos.x, target.x, this.pos.y, target.y);
    const direction = Math.atan2(distance.y, distance.x);
    // direction in degrees for canvas drawing
    this.direction = (direction * (180 / Math.PI)) + 180;

    if (getDistance(this.pos.x, 0, this.pos.y, 0).total >= config.arenaRadius) {
      // calculate how long the player has been out of bounds (in seconds)
      if (!this.outOfBounds.start) this.outOfBounds = { start: Date.now() };
      if (this.outOfBounds) {
        const elapsed = (Date.now() - this.outOfBounds.start) / 1000;
        this.outOfBounds.time = Number.parseFloat(elapsed).toFixed(2);
      }
    } else {
      this.outOfBounds = false;
    }

    let dx = 4 * Math.cos(direction);
    let dy = 4 * Math.sin(direction);

    // movement is slower when the target is close
    if (distance.total < 100) {
      dx *= distance.total / 100;
      dy *= distance.total / 100;
    }

    // move the player
    this.pos.x += dx;
    this.pos.y += dy;

    // determine the position of the spear (60 away from the player)
    const angleToSpear = (direction + (Math.PI / 2));
    this.spear.pos.x = this.pos.x + (60 * Math.cos(angleToSpear));
    this.spear.pos.y = this.pos.y + (60 * Math.sin(angleToSpear));

    this.distanceToSpear = getDistance(this.pos.x, this.spear.pos.x, this.pos.y, this.spear.pos.y);
  }
}

module.exports = Player;
