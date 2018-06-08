const _ = require('lodash');
const { Vector, Polygon } = require('sat');

const config = require('./config');
const { encode } = require('./services/parser');
const { getDistance } = require('./services/util');
const Spear = require('./Spear');

class Player {
  constructor(id, name, socket) {
    this.id = id;
    this.name = name;
    this.socket = socket;
    this.health = 100;
    this.score = 0;
    this.direction = 0;
    this.outOfBounds = false;
    this.thrown = false;
    this.deathMsg = {};
    this.quick = false;
    this.dead = false;

    // random initial position within the arena (a circle)
    // origin is at the center of the arena
    const randomAngle = _.random(2 * Math.PI);
    const randomDistance = _.random(config.arenaRadius ** 2);
    this.pos = new Vector(
      Math.sqrt(randomDistance) * Math.cos(randomAngle),
      Math.sqrt(randomDistance) * Math.sin(randomAngle),
    );

    this.spear = new Spear(this.pos);
    this.distanceToSpear = {};

    // hit box points are hard coded to fit sprite size
    this.hitbox = new Polygon(this.pos, []);
  }

  // return data that the client needs
  getData() {
    return {
      id: this.id,
      name: this.name,
      pos: this.pos,
      spear: {
        direction: this.spear.direction,
      },
      distanceToSpear: this.distanceToSpear,
      direction: this.direction,
      outOfBounds: this.outOfBounds ? this.outOfBounds : { at: 0, time: 0 },
      thrown: Boolean(this.thrown),
      quick: this.quick,
      dead: Boolean(this.dead),
    };
  }

  update(target) {
    // distance and direction to the target
    const distance = getDistance(this.pos.x, target.x, this.pos.y, target.y);
    this.direction = Math.atan2(distance.y, distance.x);

    this.checkBoundary();

    let dx = 5 * Math.cos(this.direction);
    let dy = 5 * Math.sin(this.direction);

    // movement is slower when the target is close
    if (distance.total < 100) {
      dx *= distance.total / 100;
      dy *= distance.total / 100;
      this.quick = false;
    } else this.quick = true;

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
  }

  checkBoundary() {
    if (getDistance(this.pos.x, 0, this.pos.y, 0).total >= config.arenaRadius) {
      if (!this.outOfBounds) {
        // player just passed the boundary
        this.outOfBounds = { at: Date.now() };
        this.socket.send(encode('message', {
          type: 'outOfBounds',
          target: '',
          duration: 0,
          msg: 'Get back into the fight',
        }));
      }
      // calculate time out of bounds
      this.outOfBounds.time = (Date.now() - this.outOfBounds.at) / 1000;
      // if the player is out for too long, they die
      if (this.outOfBounds.time >= config.maxTimeOutOfBounds) {
        this.takeDamage(100);
        this.deathMsg = { type: 'bounds', name: '' };
      }
    } else if (this.outOfBounds) {
      // player just came back in bounds
      this.socket.send(encode('message', {
        type: 'clear',
        target: 'outOfBounds',
        duration: 0,
        msg: '',
      }));
      this.outOfBounds = false;
    }
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

  takeDamage(value) {
    this.health -= value;
    this.health = Math.max(this.health, 0);
    this.socket.send(encode('health', { health: this.health }));
    if ((!this.health > 0) && !this.dead) this.dead = Date.now();
  }

  increaseScore(value) {
    this.score += value;
  }
}

module.exports = Player;
