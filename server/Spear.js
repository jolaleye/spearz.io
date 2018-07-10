const { Vector, Polygon } = require('sat');

class Spear {
  constructor(id, pos) {
    this.id = id;
    this.pos = { x: pos.x, y: pos.y };
    this.direction = 0;

    // collision bounds needed for SAT    values match the sprite
    // points ordered from the point of the spear clockwise around the spear head
    this.satPolygon = new Polygon(this.pos, [
      new Vector(0, -51), new Vector(9, -38), new Vector(-9, -38),
    ]);
  }

  // get spear data needed on the client
  retrieve() {
    const { pos, direction } = this;
    return { pos, direction };
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
}

module.exports = Spear;
