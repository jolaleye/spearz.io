import { lerp, angularLerp, getDistance } from '../../services/util';

class PlayerManager {
  constructor(id) {
    this.id = id;
  }

  sync = (player, timestamp) => {
    // update past and next state
    this.origin = this.next ? this.next : { ...player, timestamp };
    this.next = { ...player, timestamp };

    // set local data if needed
    if (!this.local) this.local = player;
  }

  interpolate = delta => {
    if (!this.local || !this.origin || !this.next) return;

    // interpolate between the origin and next states
    this.local.pos.x = lerp(this.origin.pos.x, this.next.pos.x, delta);
    this.local.pos.y = lerp(this.origin.pos.y, this.next.pos.y, delta);
    this.local.direction = angularLerp(this.origin.direction, this.next.direction, delta);
  }

  // copied directly from the server code...
  predict = target => {
    const distance = getDistance(this.local.pos.x, target.x, this.local.pos.y, target.y);
    this.local.direction = Math.atan2(distance.y, distance.x);

    let dx = 5 * Math.cos(this.local.direction);
    let dy = 5 * Math.sin(this.local.direction);

    // movement is slower when the target is closer
    if (distance.total < 100) {
      dx *= distance.total / 100;
      dy *= distance.total / 100;
    }

    this.local.pos.x += dx;
    this.local.pos.y += dy;
  }

  update = () => {

  }
}

export default PlayerManager;
