const _ = require('lodash');

const config = require('./config');
const { getDistance } = require('./util');
const { Vector, Polygon } = require('sat');

class Spear {
  constructor(pos) {
    this.pos = new Vector(pos.x, pos.y);
    this.direction = 0;
    this.dx = 0;
    this.dy = 0;
    // hit box points are hard coded to fit sprite size
    this.hitbox = new Polygon(this.pos, []);
  }

  update() {
    this.pos.x += this.dx;
    this.pos.y += this.dy;

    this.dx *= 0.99;
    this.dy *= 0.99;

    // update hitbox
    this.hitbox.setPoints([new Vector(0, -53.5), new Vector(5, -45), new Vector(-5, -45)]);
    this.hitbox.rotate(this.direction + (Math.PI / 2));
  }

  throw(target) {
    // distance and direction to the target
    const distance = getDistance(this.pos.x, target.x, this.pos.y, target.y);
    this.direction = Math.atan2(distance.y, distance.x);

    this.dx = 20 * Math.cos(this.direction);
    this.dy = 20 * Math.sin(this.direction);
  }
}

class Player {
  constructor(id, name, room) {
    this.id = id;
    this.name = name;
    this.room = room;
    this.health = 80;
    this.direction = 0;
    this.outOfBounds = false;
    this.thrown = false;

    // random initial position within the arena (a circle)
    // origin is at the center of the arena
    const randomAngle = _.random(2 * Math.PI);
    const randomDistance = _.random(config.arenaRadius ** 2);
    this.pos = new Vector(
      Math.sqrt(randomDistance) * Math.cos(randomAngle),
      Math.sqrt(randomDistance) * Math.sin(randomAngle),
    );

    this.spear = new Spear(this.pos);

    // hit box points are hard coded to fit sprite size
    this.hitbox = new Polygon(this.pos, []);
  }

  update(target) {
    // distance and direction to the target
    const distance = getDistance(this.pos.x, target.x, this.pos.y, target.y);
    this.direction = Math.atan2(distance.y, distance.x);

    // if the player is out of bounds, calculate how long they've been out
    if (getDistance(this.pos.x, 0, this.pos.y, 0).total >= config.arenaRadius) {
      if (!this.outOfBounds.at) this.outOfBounds = { at: Date.now() };
      const elapsed = (Date.now() - this.outOfBounds.at) / 1000;
      this.outOfBounds.time = Number.parseFloat(elapsed).toFixed(2);
    } else this.outOfBounds = false;

    let dx = 4 * Math.cos(this.direction);
    let dy = 4 * Math.sin(this.direction);

    // movement is slower when the target is close
    if (distance.total < 100) {
      dx *= distance.total / 100;
      dy *= distance.total / 100;
    }

    this.pos.x += dx;
    this.pos.y += dy;

    // update hitbox
    this.hitbox.setPoints([
      new Vector(-7, -38), new Vector(7, -38),
      new Vector(44, 28), new Vector(23, 40),
      new Vector(-23, 40), new Vector(-44, 28),
    ]);
    this.hitbox.rotate(this.direction + (Math.PI / 2));

    // if the last spear throw was > throwCooldown seconds ago, reset the spear
    const timeSinceThrow = (Date.now() - this.thrown.at) / 1000;
    if (this.thrown && timeSinceThrow > config.throwCooldown) this.thrown = false;

    // if the spear hasn't been thrown, position it according to the player
    if (!this.thrown) {
      const angleToSpear = (this.direction + (Math.PI / 2));
      this.spear.pos.x = this.pos.x + (60 * Math.cos(angleToSpear));
      this.spear.pos.y = this.pos.y + (60 * Math.sin(angleToSpear));
      this.spear.direction = this.direction;
      this.spear.dx = 0;
      this.spear.dy = 0;
      this.spear.update();
    } else this.spear.update();

    this.distanceToSpear = getDistance(
      this.pos.x, this.spear.pos.x,
      this.pos.y, this.spear.pos.y,
    );
  }

  throw(target) {
    if (this.thrown) return;
    this.thrown = { at: Date.now() };
    this.spear.throw(target);
  }
}

module.exports = Player;
