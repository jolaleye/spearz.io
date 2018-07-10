const { Vector, Polygon } = require('sat');

class Spear {
  constructor(id, pos) {
    this.id = id;
    this.pos = { x: pos.x, y: pos.y };
    this.direction = 0;

    this.vx = 0;
    this.vy = 0;

    // collision bounds needed for SAT    values match the sprite
    // points ordered from the point of the spear clockwise around the spear head
    this.satPolygon = new Polygon(this.pos, [
      new Vector(0, -51), new Vector(9, -38), new Vector(-9, -38),
    ]);
  }

  // get spear data needed on the client
  retrieve() {
    const { pos, direction } = this;
    return { pos, direction, bounds: this.bounds };
  }

  // data needed for the quadtree   width & height match the sprite
  get qt() {
    return {
      id: this.id, type: 'spear', x: this.pos.x, y: this.pos.y - 45.5, width: 18, height: 15,
    };
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

    this.pos.x = playerPos.x + (55 * Math.cos(angle));
    this.pos.y = playerPos.y + (55 * Math.sin(angle));
    this.direction = playerDirection;
  }

  launch() {
    // launch slightly inwards towards the player
    const launchAngle = this.local.spear.direction - (Math.PI / 26);
    this.local.spear.direction = launchAngle;
    this.vx = 25 * Math.cos(this.direction);
    this.vy = 25 * Math.sin(this.direction);
  }

  move() {
    if (!this.pos.x || !this.pos.y) return;

    this.pos.x += this.vx;
    this.pos.y += this.vy;

    // gradually decrease velocity
    this.vx *= 0.99;
    this.vy *= 0.99;
  }
}

module.exports = Spear;
