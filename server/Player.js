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
    this.bouncing = false;

    // random initial position within the arena (a circle)
    // origin is at the center of the arena
    const randomAngle = _.random(2 * Math.PI);
    const randomDistance = _.random(config.arenaRadius ** 2);
    this.pos = {
      x: Math.sqrt(randomDistance) * Math.cos(randomAngle),
      y: Math.sqrt(randomDistance) * Math.sin(randomAngle),
    };

    this.spear = new Spear(this.pos);

    this.dx = 0;
    this.dy = 0;
  }

  move(target) {
    // distance and direction to the target
    const distance = getDistance(this.pos.x, target.x, this.pos.y, target.y);
    const direction = Math.atan2(distance.y, distance.x);
    // direction in degrees for canvas drawing
    this.direction = (direction * (180 / Math.PI)) + 180;

    if (getDistance(this.pos.x, 0, this.pos.y, 0).total >= config.arenaRadius) {
      // BOUNDARY COLLISION
      // find the normal vector
      const nx = this.pos.x / Math.sqrt((this.pos.x ** 2) + (this.pos.y ** 2));
      const ny = this.pos.y / Math.sqrt((this.pos.x ** 2) + (this.pos.y ** 2));

      // reflect the incoming vector
      let newDX = 1.5 * (this.dx - (2 * ((nx * this.dx) + (ny * this.dy)) * nx));
      let newDY = 1.5 * (this.dy - (2 * ((nx * this.dx) + (ny * this.dy)) * ny));

      // dx and dy can't be too small
      newDX = newDX < 0 ? Math.min(-3, newDX) : Math.max(3, newDX);
      newDY = newDY < 0 ? Math.min(-3, newDY) : Math.max(3, newDY);
      // or too large
      this.dx = _.clamp(newDX, -10, 10);
      this.dy = _.clamp(newDY, -10, 10);

      this.bouncing = true;
    } else if (this.bouncing) {
      // PLAYER IS BEING BOUNCED
      this.dx *= 0.99;
      this.dy *= 0.99;

      if (Math.abs(this.dx) < 2 || Math.abs(this.dy) < 2) this.bouncing = false;
    } else {
      // NORMAL MOVEMENT
      this.dx = 4 * Math.cos(direction);
      this.dy = 4 * Math.sin(direction);
      // movement is slower when the target is close
      if (distance.total < 100) {
        this.dx *= distance.total / 100;
        this.dy *= distance.total / 100;
      }
    }

    // move the player
    this.pos.x += this.dx;
    this.pos.y += this.dy;

    // determine the position of the spear (60 away from the player)
    const angleToSpear = (direction + (Math.PI / 2));
    this.spear.pos.x = this.pos.x + (60 * Math.cos(angleToSpear));
    this.spear.pos.y = this.pos.y + (60 * Math.sin(angleToSpear));

    this.distanceToSpear = getDistance(this.pos.x, this.spear.pos.x, this.pos.y, this.spear.pos.y);
  }
}

module.exports = Player;
