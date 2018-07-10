import _ from 'lodash';
import * as PIXI from 'pixi.js';

import { lerp, angularLerp, getDistance } from '../../services/util';
import assetManager from '../../assetManager';

class PlayerManager {
  constructor(id, name) {
    this.id = id;
    this.name = name;
    this.history = [];

    this.player = new PIXI.Sprite(assetManager.textures.player);
    this.player.anchor.set(0.5, 0.5);

    this.spear = new PIXI.Sprite(assetManager.textures.spear);
    this.spear.anchor.set(0.5, 0.5);

    this.healthBarBg = new PIXI.Sprite(assetManager.textures['health-bar-bg']);
    this.healthBarFill = new PIXI.Sprite(assetManager.textures['health-bar']);

    this.healthBar = new PIXI.Container();
    this.healthBar.addChild(this.healthBarBg, this.healthBarFill);
    this.healthBar.pivot.set(this.healthBar.width / 2, this.healthBar.height / 2);

    this.nameTag = new PIXI.Text(this.name, {
      fill: 'white',
      fontFamily: 'Poppins',
      fontSize: 18,
      fontWeight: '400',
    });
    this.nameTag.anchor.set(0.5, 0.5);
  }

  sync = (player, timestamp) => {
    // update past and next state
    this.origin = this.next ? this.next : { ...player, timestamp };
    this.next = { ...player, timestamp };

    // set local data if needed
    if (!this.local) this.local = player;

    // state that should be immediately synced
    this.local.health = player.health;
    this.local.sReleased = player.released; // prevent throwing if spear is released on the server
  }

  interpolate = delta => {
    if (!this.local || !this.origin || !this.next) return;

    // interpolate between the origin and next states
    this.local.pos.x = lerp(this.origin.pos.x, this.next.pos.x, delta);
    this.local.pos.y = lerp(this.origin.pos.y, this.next.pos.y, delta);
    this.local.direction = angularLerp(this.origin.direction, this.next.direction, delta);

    this.local.spear.pos.x = lerp(this.origin.spear.pos.x, this.next.spear.pos.x, delta);
    this.local.spear.pos.y = lerp(this.origin.spear.pos.y, this.next.spear.pos.y, delta);
    this.local.spear.direction = angularLerp(
      this.origin.spear.direction, this.next.spear.direction,
      delta,
    );
  }

  // logic copied directly from the server...
  emulate = target => {
    const distance = getDistance(this.local.pos.x, target.x, this.local.pos.y, target.y);
    this.local.direction = Math.atan2(distance.y, distance.x);

    let dx = 7 * Math.cos(this.local.direction);
    let dy = 7 * Math.sin(this.local.direction);

    if (distance.total < 100) {
      dx *= distance.total / 100;
      dy *= distance.total / 100;
    }

    this.local.pos.x += dx;
    this.local.pos.y += dy;

    if (!this.local.released) {
      const angle = this.local.direction + (Math.PI / 2);
      this.local.spear.pos.x = this.local.pos.x + (55 * Math.cos(angle));
      this.local.spear.pos.y = this.local.pos.y + (55 * Math.sin(angle));
      this.local.spear.direction = this.local.direction;
    } else {
      this.local.spear.pos.x += this.local.spear.vx;
      this.local.spear.pos.y += this.local.spear.vy;
      this.local.spear.vx *= 0.99;
      this.local.spear.vy *= 0.99;
    }
  }

  // logic copied directly from the server...
  emulateThrow = () => {
    if (this.local.released || this.local.sReleased) return;

    const angle = this.local.direction + (Math.PI / 2);
    this.local.spear.pos.x = this.local.pos.x + (55 * Math.cos(angle));
    this.local.spear.pos.y = this.local.pos.y + (55 * Math.sin(angle));
    this.local.spear.direction = this.local.direction;

    const launchAngle = this.local.spear.direction - (Math.PI / 26);
    this.local.spear.direction = launchAngle;
    this.local.spear.vx = 25 * Math.cos(launchAngle);
    this.local.spear.vy = 25 * Math.sin(launchAngle);

    this.local.released = true;
    setTimeout(() => {
      this.local.released = false;
    }, 500);
  }

  reconcile = (player, lastTick) => {
    // discard history up to the last acknowledged command
    this.history = _.dropWhile(this.history, command => command.tick < lastTick);

    // apply unacknowledged movement to the server's state
    const serverState = player;
    this.history.forEach(({ target }) => {
      const distance = getDistance(serverState.pos.x, target.x, serverState.pos.y, target.y);
      serverState.direction = Math.atan2(distance.y, distance.x);

      let dx = 7 * Math.cos(serverState.direction);
      let dy = 7 * Math.sin(serverState.direction);

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
    if (disparity.pos.total > 7) {
      this.local = serverState;
    }
  }

  // update sprites
  update = offset => {
    if (!this.local) return;

    this.player.position.set(this.local.pos.x - offset.x, this.local.pos.y - offset.y);
    this.player.rotation = this.local.direction + (Math.PI / 2);

    this.spear.position.set(this.local.spear.pos.x - offset.x, this.local.spear.pos.y - offset.y);
    this.spear.rotation = this.local.spear.direction + (Math.PI / 2);

    this.healthBar.position.set(this.player.position.x, this.player.position.y + 60);
    this.healthBarFill.width = this.local.health;

    this.nameTag.position.set(this.player.position.x, this.player.position.y + 80);
  }
}

export default PlayerManager;

/* eslint no-param-reassign: off */
