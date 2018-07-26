import _ from 'lodash';
import * as PIXI from 'pixi.js';
import SAT from 'sat';

import { lerp, angularLerp, getDistance } from './util';
import assetManager from '../../../assetManager';
import config from './config';
import spriteAtlas from '../../../assets/spritesheet.json';

class PlayerManager {
  constructor(id, name) {
    this.id = id;
    this.name = name;
    this.history = [];

    this.container = new PIXI.Container();

    // player sprites & animations
    const deathSequence = [];
    spriteAtlas.animations.death.forEach(phase => {
      deathSequence.push(assetManager.textures[phase]);
    });

    const movingSequence = [];
    spriteAtlas.animations.moving.forEach(phase => {
      movingSequence.push(assetManager.textures[phase]);
    });

    this.playerAnimations = {
      still: new PIXI.Sprite(assetManager.textures.player),
      moving: new PIXI.extras.AnimatedSprite(movingSequence),
      death: new PIXI.extras.AnimatedSprite(deathSequence),
    };
    this.currentPlayerAnimation = 'still';

    this.playerAnimations.death.animationSpeed = 0.25;
    this.playerAnimations.death.loop = false;
    this.playerAnimations.death.renderable = false;

    this.playerAnimations.moving.animationSpeed = 0.2;
    this.playerAnimations.moving.renderable = false;

    this.player = new PIXI.Container();
    this.container.addChild(this.player);
    this.player.addChild(
      this.playerAnimations.still, this.playerAnimations.moving, this.playerAnimations.death,
    );
    this.player.pivot.set(this.player.width / 2, this.player.height / 2);

    this.playerSAT = new SAT.Polygon(
      new SAT.Vector(this.player.position.x, this.player.position.y),
      [
        new SAT.Vector(0, -35), new SAT.Vector(39, 25), new SAT.Vector(22, 33),
        new SAT.Vector(-22, 33), new SAT.Vector(-39, 25),
      ],
    );

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
    this.container.addChild(this.spear);
    this.spear.addChild(this.spearAnimations.holding, this.spearAnimations.flying);
    this.spear.pivot.set(this.spear.width / 2, this.spear.height / 2);

    this.spearSAT = new SAT.Polygon(
      new SAT.Vector(this.spear.position.x, this.spear.position.y),
      [
        new SAT.Vector(-9, -54), new SAT.Vector(9, -54), new SAT.Vector(9, 54),
        new SAT.Vector(-9, 54),
      ],
    );

    // health bar sprite
    this.healthBarBg = new PIXI.Sprite(assetManager.textures['health-bar-bg']);
    this.healthBarFill = new PIXI.Sprite(assetManager.textures['health-bar']);

    this.healthBar = new PIXI.Container();
    this.container.addChild(this.healthBar);
    this.healthBar.addChild(this.healthBarBg, this.healthBarFill);
    this.healthBar.pivot.set(this.healthBar.width / 2, this.healthBar.height / 2);

    // name tag
    this.nameTag = new PIXI.Text(this.name, {
      fill: 'white', fontFamily: 'Poppins', fontSize: 18, fontWeight: '400',
    });
    this.container.addChild(this.nameTag);
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
    // set prev data if needed
    if (!this.prev) this.prev = player;
    // set next data if needed
    if (!this.next) this.next = player;

    // state that should be immediately synced
    this.local.health = player.health;
    this.sReleased = player.released;
  }

  interpolate = (delta, active) => {
    if (!this.local || !this.prev || !this.next) return;

    // interpolate between the prev and next states
    this.local.pos.x = lerp(this.prev.pos.x, this.next.pos.x, delta);
    this.local.pos.y = lerp(this.prev.pos.y, this.next.pos.y, delta);
    this.local.direction = angularLerp(this.prev.direction, this.next.direction, delta);

    if (active || (!active && this.prev.released === this.next.released)) {
      this.local.spear.pos.x = lerp(this.prev.spear.pos.x, this.next.spear.pos.x, delta);
      this.local.spear.pos.y = lerp(this.prev.spear.pos.y, this.next.spear.pos.y, delta);
      this.local.spear.direction = angularLerp(
        this.prev.spear.direction, this.next.spear.direction, delta,
      );
    }
  }

  predict = target => {
    if (!this.local || !this.prev || !this.next) return;

    // reset states
    this.local.pos = _.clone(this.next.pos);
    this.prev = _.cloneDeep(this.local);
    this.next = _.cloneDeep(this.local);

    // logic copied directly from the server...
    const distance = getDistance(this.local.pos.x, target.x, this.local.pos.y, target.y);
    this.next.direction = Math.atan2(distance.y, distance.x);

    let dx = config.player.speed * Math.cos(this.next.direction);
    let dy = config.player.speed * Math.sin(this.next.direction);

    if (distance.total < 100) {
      dx *= distance.total / 100;
      dy *= distance.total / 100;
      this.animatePlayer('still');
    } else {
      this.animatePlayer('moving');
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
    this.sReleased = true;
    setTimeout(() => {
      this.animateSpear('holding');
      this.local.released = false;
    }, config.spear.cooldown);
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

    if ((!active && this.next.released) ||
    (this.local.released && this.local.spear.pos.x && this.local.spear.pos.y)) {
      // render the spear at its position if it is flying
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

  get playerBounds() {
    this.playerSAT.pos.x = this.player.position.x;
    this.playerSAT.pos.y = this.player.position.y;
    this.playerSAT.setAngle(this.player.rotation);

    return this.playerSAT;
  }

  get spearBounds() {
    this.spearSAT.pos.x = this.spear.position.x;
    this.spearSAT.pos.y = this.spear.position.y;
    this.spearSAT.setAngle(this.spear.rotation);

    return this.spearSAT;
  }

  checkHits = managers => {
    if (!this.local.released) return;

    managers.forEach(manager => {
      const hit = SAT.testPolygonPolygon(this.spearBounds, manager.playerBounds);
      if (hit) {
        this.animateSpear('holding');
        this.local.released = false;
        assetManager.sounds.hit.play();
      }
    });
  }

  checkPickups = managers => {
    managers.forEach(manager => {
      const hit = SAT.testCirclePolygon(manager.bounds, this.playerBounds);
      if (hit && manager.sprite.visible) manager.hide();
    });
  }

  animatePlayer = animation => {
    if (animation === this.currentPlayerAnimation || this.currentPlayerAnimation === 'death') {
      return;
    }

    this.player.children.forEach(child => {
      child.renderable = false;
    });

    switch (animation) {
      case 'death':
        this.playerAnimations.death.renderable = true;
        this.playerAnimations.death.play();
        this.currentPlayerAnimation = 'death';
        break;

      case 'moving':
        this.playerAnimations.moving.renderable = true;
        this.playerAnimations.moving.play();
        this.currentPlayerAnimation = 'moving';
        break;

      case 'still':
        this.playerAnimations.moving.stop();
        this.playerAnimations.still.renderable = true;
        this.currentPlayerAnimation = 'still';
        break;

      default: break;
    }
  }

  animateSpear = animation => {
    if (animation === this.currentSpearAnimation) return;

    this.spear.children.forEach(child => {
      child.renderable = false;
    });

    switch (animation) {
      case 'holding':
        this.spearAnimations.flying.stop();
        this.spearAnimations.holding.renderable = true;
        this.currentSpearAnimation = 'holding';
        break;

      case 'flying':
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
