const { Vector, Polygon } = require('sat');

const config = require('./config');

class Spear {
  constructor(id, pos) {
    this.id = id;
    this.pos = { x: pos.x, y: pos.y };
    this.direction = 0;

    this.dx = 0;
    this.dy = 0;

    // collision bounds needed for SAT    values match the sprite
    // points ordered from the point of the spear clockwise around the spear head
    this.satPolygon = new Polygon(this.pos, [
      new Vector(-9, -54), new Vector(9, -54), new Vector(9, 54), new Vector(-9, 54),
    ]);
  }

  // get spear data needed on the client
  retrieve() {
    const { pos, direction } = this;
    return { pos, direction };
  }

  // data needed for the quadtree   width & height match the sprite
  get qt() {
    return { x: this.pos.x, y: this.pos.y - 45.5, width: 18, height: 107 };
  }

  // collision bounds needed for SAT
  get bounds() {
    this.satPolygon.setAngle(this.direction + (Math.PI / 2));
    return this.satPolygon;
  }

  // follow the player's position
  follow(playerPos, playerDirection) {
    // angle from player to spear
    const angle = playerDirection + (Math.PI / 2);

    this.pos.x = playerPos.x + (config.spear.distFromPlayer * Math.cos(angle));
    this.pos.y = playerPos.y + (config.spear.distFromPlayer * Math.sin(angle));
    this.direction = playerDirection;
  }

  launch() {
    // launch slightly inwards towards the player
    const launchAngle = this.direction - (Math.PI / config.spear.throwAngleDivisor);
    this.direction = launchAngle;
    this.dx = config.spear.throwSpeed * Math.cos(launchAngle);
    this.dy = config.spear.throwSpeed * Math.sin(launchAngle);
  }

  move() {
    if (!this.pos.x || !this.pos.y) return;

    this.pos.x += this.dx;
    this.pos.y += this.dy;

    // gradually decrease velocity
    this.dx *= 0.99;
    this.dy *= 0.99;
  }
}

module.exports = Spear;
