const { Vector, Polygon } = require('sat');

const { getDistance } = require('./util');

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

module.exports = Spear;
