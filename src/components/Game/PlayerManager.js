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
    spriteAtlas.animations.death.forEach(phase => {
      deathSequence.push(assetManager.textures[phase]);
    });

    this.playerAnimations = {
      normal: new PIXI.Sprite(assetManager.textures.player),
      death: new PIXI.extras.AnimatedSprite(deathSequence),
    };
    this.currentPlayerAnimation = 'normal';

    this.playerAnimations.death.animationSpeed = 0.25;
    this.playerAnimations.death.loop = false;
    this.playerAnimations.death.renderable = false;

    this.player = new PIXI.Container();
    this.player.addChild(this.playerAnimations.normal, this.playerAnimations.death);
    this.player.pivot.set(this.player.width / 2, this.player.height / 2);

    // spear sprites & animations
    const flyingSequence = [];
    spriteAtlas.animations.spear.forEach(phase => {
      flyingSequence.push(assetManager.textures[phase]);
    });

    this.spearAnimations = {
      holding: new PIXI.Sprite(assetManager.textures.spear),
      flying: new PIXI.extras.AnimatedSprite(flyingSequence),
    };
    this.currentSpearAnimation = 'still';

    this.spearAnimations.flying.animationSpeed = 0.15;
    this.spearAnimations.flying.renderable = false;

    this.spear = new PIXI.Container();
    this.spear.addChild(this.spearAnimations.holding, this.spearAnimations.flying);
    this.spear.pivot.set(this.spear.width / 2, this.spear.height / 2);

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

  interpolate = (delta, active) => {
    if (!this.local || !this.prev || !this.next) return;

    // interpolate between the prev and next states
    this.local.pos.x = lerp(this.prev.pos.x, this.next.pos.x, delta);
    this.local.pos.y = lerp(this.prev.pos.y, this.next.pos.y, delta);
    this.local.direction = angularLerp(this.prev.direction, this.next.direction, delta);

    if (active || (this.prev.released === this.next.released)) {
      this.local.spear.pos.x = lerp(this.prev.spear.pos.x, this.next.spear.pos.x, delta);
      this.local.spear.pos.y = lerp(this.prev.spear.pos.y, this.next.spear.pos.y, delta);
      this.local.spear.direction = angularLerp(
        this.prev.spear.direction, this.next.spear.direction, delta,
      );
    }
  }

  // logic copied directly from the server...
  predict = target => {
    this.local.pos = this.next ? _.clone(this.next.pos) : this.local.pos;
    this.prev = _.cloneDeep(this.local);
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

    if (this.local.released) {
      this.next.spear.pos.x = this.local.spear.pos.x + this.local.spear.dx;
      this.next.spear.pos.y = this.local.spear.pos.y + this.local.spear.dy;
      this.local.spear.dx *= 0.99;
      this.local.spear.dy *= 0.99;
    }
  }

  // logic copied directly from the server...
  emulateThrow = () => {
    // reset the spear's position & direction to the player's
    const angle = this.local.direction + (Math.PI / 2);
    this.local.spear.pos.x = this.local.pos.x + (config.spear.distFromPlayer * Math.cos(angle));
    this.local.spear.pos.y = this.local.pos.y + (config.spear.distFromPlayer * Math.sin(angle));
    this.local.spear.direction = this.local.direction;

    const launchAngle = this.local.spear.direction - (Math.PI / config.spear.throwAngleDivisor);
    this.local.spear.direction = launchAngle;
    this.local.spear.dx = config.spear.throwSpeed * Math.cos(launchAngle);
    this.local.spear.dy = config.spear.throwSpeed * Math.sin(launchAngle);

    if (this.prev && this.next) {
      this.prev.spear = _.cloneDeep(this.local.spear);
      this.next.spear = _.cloneDeep(this.local.spear);
    }

    this.animateSpear('flying');
    this.local.released = true;
    setTimeout(this.returnSpear, config.spear.cooldown);
  }

  returnSpear = () => {
    this.animateSpear('holding');
    this.local.released = false;
  }

  reconcile = (player, lastTick) => {
    // discard history up to the last acknowledged command
    this.history = _.dropWhile(this.history, command => command.tick < lastTick);

    if (!this.next || !this.local) return;

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
      this.local.pos = serverState.pos;
    }
  }

  hide = ({ player, spear, health, name }) => {
    this.player.visible = !player;
    this.spear.visible = !spear;
    this.healthBar.visible = !health;
    this.nameTag.visible = !name;
  }

  // update sprites
  update = (offset, active) => {
    if (!this.local) return;

    this.player.position.set(this.local.pos.x - offset.x, this.local.pos.y - offset.y);
    this.player.rotation = this.local.direction + (Math.PI / 2);

    if (!active || (this.local.released && this.local.spear.pos.x && this.local.spear.pos.y)) {
      // render the spear at its position if it is flying or for other players
      this.spear.position.set(this.local.spear.pos.x - offset.x, this.local.spear.pos.y - offset.y);
      this.spear.rotation = this.local.spear.direction + (Math.PI / 2);
    } else {
      // otherwise place it next to the player
      const angle = this.local.direction + (Math.PI / 2);
      this.spear.position.set(
        this.player.position.x + (config.spear.distFromPlayer * Math.cos(angle)),
        this.player.position.y + (config.spear.distFromPlayer * Math.sin(angle)),
      );
      this.spear.rotation = this.player.rotation;
    }

    this.healthBar.position.set(this.player.position.x, this.player.position.y + 60);
    this.healthBarFill.width = this.local.health;

    this.nameTag.position.set(this.player.position.x, this.player.position.y + 80);
  }

  animatePlayer = animation => {
    if (animation === this.currentPlayerAnimation) return;

    switch (animation) {
      case 'death':
        this.playerAnimations.normal.renderable = false;
        this.playerAnimations.death.renderable = true;
        this.playerAnimations.death.play();
        this.currentPlayerAnimation = 'death';
        break;

      default: break;
    }
  }

  animateSpear = animation => {
    if (animation === this.currentSpearAnimation) return;

    switch (animation) {
      case 'holding':
        this.spearAnimations.holding.renderable = true;
        this.spearAnimations.flying.renderable = false;
        this.spearAnimations.flying.stop();
        this.currentSpearAnimation = 'holding';
        break;

      case 'flying':
        this.spearAnimations.holding.renderable = false;
        this.spearAnimations.flying.renderable = true;
        this.spearAnimations.flying.play();
        this.currentSpearAnimation = 'flying';
        break;

      default: break;
    }
  }
}

export default PlayerManager;

/* eslint no-param-reassign: off */
