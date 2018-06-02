const _ = require('lodash');
const { Vector, Polygon } = require('sat');

const config = require('./config');
const { getDistance } = require('./util');
const Spear = require('./Spear');

class Player {
  constructor(id, name) {
    this.id = id;
    this.name = name;
    this.health = 100;
    this.score = 0;
    this.direction = 0;
    this.outOfBounds = false;
    this.thrown = false;
    this.message = false;

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

    if (getDistance(this.pos.x, 0, this.pos.y, 0).total >= config.arenaRadius) {
      this.setMessage({ type: 'out', msg: 'Get back into the fight!' });
      // if outOfBounds doesn't have values yet, set them
      if (!this.outOfBounds) this.outOfBounds = { at: Date.now(), lastTick: Date.now() };
      // calculate time out of bounds
      this.outOfBounds.time = (Date.now() - this.outOfBounds.at) / 1000;
      // if the player is out for too long, they die
      if (this.outOfBounds.time >= config.maxTimeOutOfBounds) this.takeDamage(100);
    } else {
      this.outOfBounds = false;
      if (this.message.type === 'out') this.message = false;
    }

    let dx = 4.5 * Math.cos(this.direction);
    let dy = 4.5 * Math.sin(this.direction);

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

    this.updateSpear();
    this.updateMessage();
  }

  updateSpear() {
    const timeSinceThrow = (Date.now() - this.thrown.at) / 1000;
    // if the last spear throw was > throwCooldown seconds ago, reset the spear
    if (this.thrown && timeSinceThrow > config.throwCooldown) this.resetSpear();

    // if the spear hasn't been thrown, position it according to the player
    if (!this.thrown) {
      const angleToSpear = (this.direction + (Math.PI / 2));
      this.spear.pos.x = this.pos.x + (60 * Math.cos(angleToSpear));
      this.spear.pos.y = this.pos.y + (60 * Math.sin(angleToSpear));
      this.spear.direction = this.direction;
    }

    this.spear.update();

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

  resetSpear() {
    this.thrown = false;
    this.spear.dx = 0;
    this.spear.dy = 0;
  }

  checkStatus() {
    return this.health > 0;
  }

  takeDamage(value) {
    this.health -= value;
    this.health = Math.max(this.health, 0);
  }

  increaseScore(value) {
    this.score += value;
  }

  setMessage(data) {
    // if the message is new, update
    if (data.msg !== this.message.msg) {
      this.message = { ...data, timestamp: Date.now() };
    }
  }

  updateMessage() {
    if (!this.message) return;
    // expire messages based on their type
    const messageAge = (Date.now() - this.message.timestamp) / 1000;
    if (this.message.type === 'kill' && messageAge > 3) this.message = false;
  }
}

module.exports = Player;
