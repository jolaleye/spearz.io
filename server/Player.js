const _ = require('lodash');

const config = require('./config');
const { getDistance } = require('./services/util');
const Spear = require('./Spear');
const { pack } = require('./services/cereal');

class Player {
  constructor(client, nickname) {
    this.client = client;
    this.id = client.id;
    this.name = nickname;

    // random initial position within the circular arena with origin (0,0)
    const randomAngle = _.random(2 * Math.PI);
    const randomDistance = _.random(config.arenaRadius ** 2);
    this.pos = {
      x: Math.sqrt(randomDistance) * Math.cos(randomAngle),
      y: Math.sqrt(randomDistance) * Math.sin(randomAngle),
    };

    this.direction = 0;

    this.spear = new Spear(this.pos);
    this.released = false;

    this.health = 100;
    this.dead = false;

    this.outOfBounds = { out: false, interval: null };
  }

  // get player data needed on the client
  retrieve() {
    const { id, name, health, pos, direction, spear } = this;
    return { id, name, health, pos, direction, spear };
  }

  // data needed for the quadtree   values match the sprite
  get qt() {
    return { x: this.pos.x, y: this.pos.y, width: 77, height: 69 };
  }

  move(target) {
    this.checkBoundary();

    const distance = getDistance(this.pos.x, target.x, this.pos.y, target.y);
    this.direction = Math.atan2(distance.y, distance.x);

    let dx = 7 * Math.cos(this.direction);
    let dy = 7 * Math.sin(this.direction);

    // movement is slower when the target is closer
    if (distance.total < 100) {
      dx *= distance.total / 100;
      dy *= distance.total / 100;
    }

    this.pos.x += dx;
    this.pos.y += dy;

    // bring the spear with if it hasn't been released
    if (!this.released) {
      this.spear.follow(this.pos, this.direction);
    }
  }

  checkBoundary() {
    const distanceFromCenter = getDistance(this.pos.x, 0, this.pos.y, 0);
    if (distanceFromCenter.total >= config.arenaRadius && !this.outOfBounds.out) {
      // just went out of bounds - take damage every second
      this.outOfBounds.interval = setInterval(() => this.damage(10, 'bounds'), 1000);
      this.outOfBounds.out = true;
      // inform the client
      this.client.send(pack({ _: 'message', type: 'bounds' }));
    } else if (distanceFromCenter.total < config.arenaRadius && this.outOfBounds.out) {
      // just came back in - stop taking damage
      clearInterval(this.outOfBounds.interval);
      this.outOfBounds.out = false;
      // inform the client
      this.client.send(pack({ _: 'clearMessage', type: 'bounds' }));
    }
  }

  damage(value, from) {
    this.health -= value;
    this.health = Math.max(this.health, 0);
    // inform the client if they die
    if (this.health === 0 && !this.dead) {
      this.dead = true;
      this.client.send(pack({ _: 'dead', from }));
    }
  }
}

module.exports = Player;
