import _ from 'lodash';
import * as PIXI from 'pixi.js';

import { lerp, angularLerp, getDistance } from './util';
import assetManager from '../../assetManager';
import config from './config';
import spriteAtlas from '../../assets/spritesheet.json';

class PlayerManager {
  constructor(id, name) {
    this.id = id;
    this.name = name;
    this.history = [];

    // player sprites & animations
    const deathSequence = [];
    spriteAtlas.animations.death.forEach(phase => deathSequence.push(assetManager.textures[phase]));

    this.playerAnimations = {
      normal: new PIXI.Sprite(assetManager.textures.player),
      death: new PIXI.extras.AnimatedSprite(deathSequence),
    };
    this.currentAnimation = 'normal';

    this.playerAnimations.death.animationSpeed = 0.25;
    this.playerAnimations.death.loop = false;
    this.playerAnimations.death.renderable = false;

    this.player = new PIXI.Container();
    this.player.addChild(this.playerAnimations.normal, this.playerAnimations.death);
    this.player.pivot.set(this.player.width / 2, this.player.height / 2);

    // spear sprites & animations
    this.spear = new PIXI.Sprite(assetManager.textures.spear);
    this.spear.anchor.set(0.5, 0.5);

    // health bar sprite
    this.healthBarBg = new PIXI.Sprite(assetManager.textures['health-bar-bg']);
    this.healthBarFill = new PIXI.Sprite(assetManager.textures['health-bar']);

    this.healthBar = new PIXI.Container();
    this.healthBar.addChild(this.healthBarBg, this.healthBarFill);
    this.healthBar.pivot.set(this.healthBar.width / 2, this.healthBar.height / 2);

    // name tag
    this.nameTag = new PIXI.Text(this.name, {
      fill: 'white', fontFamily: 'Poppins', fontSize: 18, fontWeight: '400',
    });
    this.nameTag.anchor.set(0.5, 0.5);
  }

  sync = (player, timestamp, active) => {
    // update previous and next state (only for other players)
    if (!active) {
      this.prev = this.next ? _.cloneDeep(this.next) : { ...player, timestamp };
      this.next = { ...player, timestamp };
    }

    // set local data if needed
    if (!this.local) this.local = player;

    // state that should be immediately synced
    this.local.health = player.health;
  }

  interpolate = delta => {
    if (!this.local || !this.prev || !this.next) return;

    // interpolate between the prev and next states
    this.local.pos.x = lerp(this.prev.pos.x, this.next.pos.x, delta);
    this.local.pos.y = lerp(this.prev.pos.y, this.next.pos.y, delta);
    this.local.direction = angularLerp(this.prev.direction, this.next.direction, delta);

    this.local.spear.pos.x = lerp(this.prev.spear.pos.x, this.next.spear.pos.x, delta);
    this.local.spear.pos.y = lerp(this.prev.spear.pos.y, this.next.spear.pos.y, delta);
    this.local.spear.direction = angularLerp(
      this.prev.spear.direction, this.next.spear.direction, delta,
    );
  }

  // logic copied directly from the server...
  predict = target => {
    const distance = getDistance(this.local.pos.x, target.x, this.local.pos.y, target.y);
    this.local.direction = Math.atan2(distance.y, distance.x);

    let dx = config.player.speed * Math.cos(this.local.direction);
    let dy = config.player.speed * Math.sin(this.local.direction);

    if (distance.total < 100) {
      dx *= distance.total / 100;
      dy *= distance.total / 100;
    }

    this.local.pos.x += dx;
    this.local.pos.y += dy;

    if (!this.local.released) {
      const angle = this.local.direction + (Math.PI / 2);
      this.local.spear.pos.x = this.local.pos.x + (config.spear.distFromPlayer * Math.cos(angle));
      this.local.spear.pos.y = this.local.pos.y + (config.spear.distFromPlayer * Math.sin(angle));
      this.local.spear.direction = this.local.direction;
    } else {
      this.local.spear.pos.x = this.local.spear.pos.x + this.local.spear.vx;
      this.local.spear.pos.y = this.local.spear.pos.y + this.local.spear.vy;
      this.local.spear.vx *= 0.99;
      this.local.spear.vy *= 0.99;
    }
  }

  // logic copied directly from the server...
  emulateThrow = () => {
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
      this.local.pos.x, serverState.pos.x, this.local.pos.y, serverState.pos.y,
    );

    // adopt the server's authoritative state if the disparity is large enough
    if (disparity.total > config.reconciliationThreshold) {
      this.local = serverState;
    }
  }

  hide = ({ player, spear, health, name }) => {
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

    this.spear.position.set(this.local.spear.pos.x - offset.x, this.local.spear.pos.y - offset.y);
    this.spear.rotation = this.local.spear.direction + (Math.PI / 2);

    this.healthBar.position.set(this.player.position.x, this.player.position.y + 60);
    this.healthBarFill.width = this.local.health;

    this.nameTag.position.set(this.player.position.x, this.player.position.y + 80);
  }

  play = animation => {
    if (animation === this.currentAnimation) return;

    switch (animation) {
      case 'death':
        this.playerAnimations.normal.renderable = false;
        this.playerAnimations.death.renderable = true;
        this.playerAnimations.death.play();
        this.currentAnimation = 'death';
        break;

      default: break;
    }
  }
}

export default PlayerManager;

/* eslint no-param-reassign: off */
