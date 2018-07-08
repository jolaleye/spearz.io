import _ from 'lodash';
import * as PIXI from 'pixi.js';

import { lerp, angularLerp, getDistance } from '../../services/util';
import assetManager from '../../assetManager';

class PlayerManager {
  constructor(id) {
    this.id = id;
    this.history = [];

    this.player = new PIXI.Sprite(assetManager.textures.player);
    this.player.anchor.set(0.5, 0.5);
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

    let dx = 6.5 * Math.cos(this.local.direction);
    let dy = 6.5 * Math.sin(this.local.direction);

    // movement is slower when the target is closer
    if (distance.total < 100) {
      dx *= distance.total / 100;
      dy *= distance.total / 100;
    }

    this.local.pos.x += dx;
    this.local.pos.y += dy;
  }

  reconcile = (player, lastTick) => {
    // discard history up to the last acknowledged command
    this.history = _.dropWhile(this.history, command => command.tick < lastTick);

    // apply unacknowledged commands to the server's state
    const serverState = player;
    this.history.forEach(({ target }) => {
      const distance = getDistance(serverState.pos.x, target.x, serverState.pos.y, target.y);
      serverState.direction = Math.atan2(distance.y, distance.x);

      let dx = 6.5 * Math.cos(serverState.direction);
      let dy = 6.5 * Math.sin(serverState.direction);

      if (distance.total < 100) {
        dx *= distance.total / 100;
        dy *= distance.total / 100;
      }

      serverState.pos.x += dx;
      serverState.pos.y += dy;
    });

    // the difference between the local state and the server state + unacknowledged input
    const disparity = {
      pos: getDistance(this.local.pos.x, serverState.pos.x, this.local.pos.y, serverState.pos.y),
      direction: this.local.direction - serverState.direction,
    };

    // adopt the server's authoritative state if the disparity is large enough
    // threshold = maximum distance traveled in one tick... bc it seems right
    if (disparity.pos.total > 6.5) {
      this.local = serverState;
    }
  }

  update = screen => {
    if (!this.local) return;

    const offset = {
      x: this.local.pos.x - (screen.width / 2),
      y: this.local.pos.y - (screen.height / 2),
    };

    this.player.position.set(this.local.pos.x - offset.x, this.local.pos.y - offset.y);
    this.player.rotation = this.local.direction + (Math.PI / 2);
  }
}

export default PlayerManager;
