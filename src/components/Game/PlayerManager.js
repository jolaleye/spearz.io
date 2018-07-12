import _ from 'lodash';
import * as PIXI from 'pixi.js';

import { lerp, angularLerp, getDistance } from '../../services/util';
import assetManager from '../../assetManager';
import config from './config';

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

  sync = (player, timestamp, active) => {
    // update past and next state (only for other players)
    if (!active) {
      this.origin = this.next ? _.cloneDeep(this.next) : { ...player, timestamp };
      this.next = { ...player, timestamp };
    }

    // set local data if needed
    if (!this.local) this.local = player;

    // state that should be immediately synced
    this.local.health = player.health;
  }

  interpolate = delta => {
    if (!this.local || !this.origin || !this.next) return;

    // interpolate between the origin and next states
    this.local.pos.x = lerp(this.origin.pos.x, this.next.pos.x, delta);
    this.local.pos.y = lerp(this.origin.pos.y, this.next.pos.y, delta);
    this.local.direction = angularLerp(this.origin.direction, this.next.direction, delta);

    this.local.spear.pos.x = lerp(this.origin.spear.pos.x, this.next.spear.pos.x, delta);
    this.local.spear.pos.y = lerp(this.origin.spear.pos.y, this.next.spear.pos.y, delta);
    if (!this.local.released) {
      this.local.spear.direction = angularLerp(
        this.origin.spear.direction, this.next.spear.direction, delta,
      );
    }
  }

  // logic copied directly from the server...
  predict = target => {
    if (this.next) {
      this.local.pos = _.clone(this.next.pos);
    }
    this.origin = _.cloneDeep(this.local);
    this.next = _.cloneDeep(this.local);

    const distance = getDistance(this.local.pos.x, target.x, this.local.pos.y, target.y);
    this.next.direction = Math.atan2(distance.y, distance.x);

    let dx = config.player.speed * Math.cos(this.next.direction);
    let dy = config.player.speed * Math.sin(this.next.direction);

    if (distance.total < 100) {
      dx *= distance.total / 100;
      dy *= distance.total / 100;
    }

    this.next.pos.x = this.local.pos.x + dx;
    this.next.pos.y = this.local.pos.y + dy;

    if (!this.local.released) {
      const angle = this.next.direction + (Math.PI / 2);
      this.next.spear.pos.x = this.next.pos.x + (config.spear.distFromPlayer * Math.cos(angle));
      this.next.spear.pos.y = this.next.pos.y + (config.spear.distFromPlayer * Math.sin(angle));
      this.next.spear.direction = this.next.direction;
    } else {
      this.next.spear.pos.x = this.local.spear.pos.x + this.local.spear.vx;
      this.next.spear.pos.y = this.local.spear.pos.y + this.local.spear.vy;
      this.local.spear.vx *= 0.99;
      this.local.spear.vy *= 0.99;
    }
  }

  // logic copied directly from the server...
  emulateThrow = () => {
    if (this.local.released) return;

    const angle = this.local.direction + (Math.PI / 2);
    this.local.spear.pos.x = this.local.pos.x + (config.spear.distFromPlayer * Math.cos(angle));
    this.local.spear.pos.y = this.local.pos.y + (config.spear.distFromPlayer * Math.sin(angle));

    const launchAngle = this.local.spear.direction - (Math.PI / config.spear.throwAngleDivisor);
    this.local.spear.direction = launchAngle;
    this.local.spear.vx = config.spear.throwSpeed * Math.cos(launchAngle);
    this.local.spear.vy = config.spear.throwSpeed * Math.sin(launchAngle);

    this.local.released = true;
    setTimeout(() => {
      this.local.released = false;
      this.local.spear.pos.x = this.local.pos.x + (config.spear.distFromPlayer * Math.cos(angle));
      this.local.spear.pos.y = this.local.pos.y + (config.spear.distFromPlayer * Math.sin(angle));
    }, config.spear.cooldown);
  }

  reconcile = (player, lastTick) => {
    // discard history up to the last acknowledged command
    this.history = _.dropWhile(this.history, command => command.tick < lastTick);

    // apply unacknowledged movement to the server's state
    const serverState = player;
    this.history.forEach(({ target }) => {
      const distance = getDistance(serverState.pos.x, target.x, serverState.pos.y, target.y);
      serverState.direction = Math.atan2(distance.y, distance.x);

      let dx = config.player.speed * Math.cos(serverState.direction);
      let dy = config.player.speed * Math.sin(serverState.direction);

      if (distance.total < 100) {
        dx *= distance.total / 100;
        dy *= distance.total / 100;
      }

      serverState.pos.x += dx;
      serverState.pos.y += dy;
    });

    // position disparity between the local state and the server state + unacknowledged input
    const disparity = getDistance(
      this.next.pos.x, serverState.pos.x, this.next.pos.y, serverState.pos.y,
    );

    // adopt the server's authoritative state if the disparity is large enough
    if (disparity.total > config.reconciliationThreshold) {
      this.local = serverState;
    }
  }

  hide = (player, spear, health, name) => {
    this.player.visible = !player;
    this.spear.visible = !spear;
    this.healthBar.visible = !health;
    this.nameTag.visible = !name;
  }

  // update sprites
  update = offset => {
    if (!this.local) return;

    this.player.position.set(this.local.pos.x - offset.x, this.local.pos.y - offset.y);
    this.player.rotation = this.local.direction + (Math.PI / 2);

    if (Number.isFinite(this.local.spear.pos.x) && Number.isFinite(this.local.spear.pos.y)) {
      this.spear.position.set(this.local.spear.pos.x - offset.x, this.local.spear.pos.y - offset.y);
      this.spear.rotation = this.local.spear.direction + (Math.PI / 2);
    }

    this.healthBar.position.set(this.player.position.x, this.player.position.y + 60);
    this.healthBarFill.width = this.local.health;

    this.nameTag.position.set(this.player.position.x, this.player.position.y + 80);
  }
}

export default PlayerManager;

/* eslint no-param-reassign: off */
