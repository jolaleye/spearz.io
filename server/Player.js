const _ = require('lodash');
const { Vector, Polygon } = require('sat');

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
    this.pos = new Vector(
      Math.sqrt(randomDistance) * Math.cos(randomAngle),
      Math.sqrt(randomDistance) * Math.sin(randomAngle),
    );

    this.quick = false;

    this.direction = 0;

    this.spear = new Spear(this.id, this.pos);
    this.released = false;
    this.release = null;

    this.health = 100;
    this.dead = false;

    this.score = 0;
    this.rank = 0;

    this.outOfBounds = { out: false, interval: null };

    // collision bounds needed for SAT    points match the sprite
    // points ordered from the point of the player clockwise
    this.satPolygon = new Polygon(this.pos, [
      new Vector(0, -35), new Vector(39, 25), new Vector(22, 33),
      new Vector(-22, 33), new Vector(-39, 25),
    ]);

    // data needed for the quadtree   width & height match the sprite
    this.type = 'player';
    this.width = 77;
    this.height = 69;
  }

  // get player data needed on the client
  retrieve() {
    const { id, name, health, dead, pos, direction, spear, released, quick } = this;
    return { id, name, health, dead, pos, direction, spear: spear.retrieve(), released, quick };
  }

  // collision bounds needed for SAT
  get bounds() {
    this.satPolygon.setAngle(this.direction + (Math.PI / 2));
    return this.satPolygon;
  }

  // data needed for the leaderboard
  get lb() {
    return { id: this.id, name: this.name, score: this.score, rank: this.rank };
  }

  move(target) {
    this.checkBoundary();

    const distance = getDistance(this.pos.x, target.x, this.pos.y, target.y);
    this.direction = Math.atan2(distance.y, distance.x);

    let dx = config.player.speed * Math.cos(this.direction);
    let dy = config.player.speed * Math.sin(this.direction);

    // movement is slower when the target is closer
    if (distance.total < 100) {
      dx *= distance.total / 100;
      dy *= distance.total / 100;
      this.quick = false;
    } else {
      this.quick = true;
    }

    this.pos.x += dx;
    this.pos.y += dy;

    // bring the spear with if it hasn't been released
    if (!this.released) {
      this.spear.follow(this.pos, this.direction);
    } else {
      // otherwise let it do its thing
      this.spear.move();
    }
  }

  checkBoundary() {
    const distanceFromCenter = getDistance(this.pos.x, 0, this.pos.y, 0);
    if (distanceFromCenter.total >= config.arenaRadius && !this.outOfBounds.out) {
      // just went out of bounds - take damage every second
      this.outOfBounds.interval = setInterval(() => {
        this.damage(config.damage.bounds, 'bounds');
      }, config.damage.boundsFreq);
      this.outOfBounds.out = true;
      // inform the client
      this.client.send(pack('message', { type: 'bounds' }));
    } else if (distanceFromCenter.total < config.arenaRadius && this.outOfBounds.out) {
      // just came back in - stop taking damage
      clearInterval(this.outOfBounds.interval);
      this.outOfBounds.out = false;
      // inform the client
      this.client.send(pack('clearMessage', { type: 'bounds' }));
    }
  }

  damage(value, from, name = '') {
    // stop & restart health regen
    clearTimeout(this.regenTimer);
    clearInterval(this.regenInterval);

    this.regenTimer = setTimeout(() => {
      this.regenInterval = setInterval(() => {
        this.heal(config.player.regen.amount);
      }, config.player.regen.freq);
    }, config.player.regen.wait);

    // take damage
    this.health -= value;
    this.health = Math.max(this.health, 0);

    // inform the client if they die
    if (this.health === 0 && !this.dead) {
      this.dead = true;
      this.client.send(pack('dead', { from, name }));
    }
  }

  heal(value) {
    this.health += value;
    this.health = Math.min(this.health, 100);
    if (this.health === 100) clearInterval(this.regenInterval);
  }

  throwSpear() {
    if (this.released || !this.spear) return;

    // reset then launch
    this.spear.follow(this.pos, this.direction);
    this.spear.launch();

    // release time = server time - latency - interpolation delay
    this.release = Date.now() - this.client.latency - 50;

    this.released = true;
    // timer for the spear to return
    setTimeout(() => {
      this.released = false;
    }, config.spear.cooldown);
  }

  increaseScore(value) {
    this.score += value;
    this.client.send(pack('score', { value }));
  }
}

module.exports = Player;
