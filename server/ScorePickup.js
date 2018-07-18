const { Vector, Circle } = require('sat');
const _ = require('lodash');

const config = require('./config');
const { ID } = require('./services/util');

class ScorePickup {
  constructor() {
    this.id = ID();

    // random initial position within the circular arena with origin (0,0)
    const randomAngle = _.random(2 * Math.PI);
    const randomDistance = _.random(config.arenaRadius ** 2);
    this.pos = new Vector(
      Math.sqrt(randomDistance) * Math.cos(randomAngle),
      Math.sqrt(randomDistance) * Math.sin(randomAngle),
    );

    // collision bounds needed for SAT
    this.bounds = new Circle(this.pos, 5);
  }

  // retrieve data needed on the client
  retrieve() {
    const { id, pos } = this;
    return { id, pos };
  }

  // data needed for the quadtree   width & height match the sprite
  get qt() {
    return { id: this.id, type: 'score', x: this.pos.x, y: this.pos.y, width: 10, height: 10 };
  }
}

module.exports = ScorePickup;
