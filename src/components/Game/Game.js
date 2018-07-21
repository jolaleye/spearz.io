import React, { Component, createRef } from 'react';
import * as PIXI from 'pixi.js';
import _ from 'lodash';
import 'pixi-layers';

import './Game.css';
import HUD from './HUD/HUD';
import { pack, unpack } from '../../services/cereal';
import ArenaManager from './core/ArenaManager';
import PlayerManager from './core/PlayerManager';
import ScorePickupManager from './core/ScorePickupManager';
import CanvasHUD from './core/HUD';
import config from './core/config';
import assetManager from '../../assetManager';
import { getDistance } from './core/util';

class Game extends Component {
  canvasRef = createRef();

  componentDidMount() {
    // PIXI application
    this.app = new PIXI.Application({
      view: this.canvasRef.current,
      antialias: true,
      resolution: window.devicePixelRatio,
      transparent: true,
    });

    this.app.stage = new PIXI.display.Stage();

    this.arenaGroup = new PIXI.display.Group(0, false);
    this.pickupGroup = new PIXI.display.Group(1, false);
    this.playerGroup = new PIXI.display.Group(2, false);

    this.app.stage.addChild(
      new PIXI.display.Layer(this.arenaGroup),
      new PIXI.display.Layer(this.pickupGroup),
      new PIXI.display.Layer(this.playerGroup),
    );

    // canvas sizing
    this.app.renderer.autoResize = true;
    window.addEventListener('resize', this.resize);
    this.viewDistance = 0;

    // SFX
    assetManager.sounds.soundtrack.play();

    this.hud = new CanvasHUD(this.app, this.props.socket);

    // manager for arena related rendering
    this.arenaManager = new ArenaManager(this.app.screen);
    this.app.stage.addChild(this.arenaManager.background, this.arenaManager.boundary);
    this.arenaManager.background.parentGroup = this.arenaGroup;
    this.arenaManager.boundary.parentGroup = this.arenaGroup;

    // managers for player rendering
    this.playerManagers = [];

    // managers for score pick-ups
    this.scorePickupManagers = [];

    // listen for snapshots
    this.props.socket.addEventListener('message', packet => {
      const data = unpack(packet.data);
      switch (data._) {
        case 'snapshot':
          this.sync(data);
          break;

        case 'scorePickup':
          this.addScorePickup(data.id, data.pos);
          break;

        case 'removeScorePickup':
          this.removeScorePickup(data.id);
          break;

        case 'hit':
          assetManager.sounds.hit.play();
          if (this.activeManager) this.activeManager.returnSpear();
          break;

        case 'dead':
          this.stop();
          break;

        default: break;
      }
    });

    // throw listeners
    window.addEventListener('keydown', this.throwSpear);
    window.addEventListener('click', this.throwSpear);

    this.serverTick = 0;
    this.tick = 0;
    this.sinceSnapshot = 0;
    this.sincePrediction = 0;

    // render loop
    this.app.ticker.add(this.renderX);
    // target tracking
    this.trackingInterval = setInterval(this.track, config.tickrate);

    this.resize();
  }

  componentWillUnmount() {
    this.app.ticker.stop();
    clearInterval(this.trackingInterval);
    this.playerManagers = [];
    this.app.stage.removeChildren();
    assetManager.sounds.bounds.stop();
    assetManager.sounds.soundtrack.stop();
  }

  resize = () => {
    this.app.renderer.resize(window.innerWidth, window.innerHeight);
    this.arenaManager.resize();

    // maximum distance an entity can be from the player and be visible
    this.viewDistance =
      Math.sqrt(((this.app.screen.width / 2) ** 2) + ((this.app.screen.height / 2) ** 2));
    this.props.socket.send(pack('clientView', { distance: Math.ceil(this.viewDistance) }));
  }

  render = () => (
    <div className="game is-hidden-touch">
      <canvas ref={this.canvasRef} />
      <HUD socket={this.props.socket} changeMode={this.props.changeMode} />
    </div>
  );


  get activeManager() {
    return this.playerManagers.find(mngr => mngr.id === this.props.socket.id);
  }

  get offset() {
    return {
      x: this.activeManager.local.pos.x - (this.app.screen.width / 2),
      y: this.activeManager.local.pos.y - (this.app.screen.height / 2),
    };
  }


  stop = () => {
    // stop target tracking
    clearInterval(this.trackingInterval);

    // remove player health bar, name, spear & play death animation
    this.activeManager.hide({ player: false, spear: true, name: true, health: true });
    this.activeManager.animatePlayer('death');
  }

  renderX = () => {
    if (!this.activeManager) return;

    this.sinceSnapshot += this.app.ticker.elapsedMS;
    this.sincePrediction += this.app.ticker.elapsedMS;

    // player rendering
    this.playerManagers.forEach(manager => {
      let smoothPeriod;
      let delta;

      if (manager.id !== this.activeManager.id) {
        smoothPeriod = manager.next.timestamp - manager.prev.timestamp;
        delta = this.sinceSnapshot / smoothPeriod;
      } else {
        smoothPeriod = config.tickrate;
        delta = this.sincePrediction / smoothPeriod;
      }

      manager.interpolate(_.clamp(delta, 1), manager.id === this.props.socket.id);
      manager.update(this.offset, manager.id === this.props.socket.id);
    });

    // arena rendering
    this.arenaManager.update(this.offset);

    // pick-ups
    this.scorePickupManagers.forEach(manager => {
      const distanceToCenter = getDistance(
        manager.pos.x - this.offset.x, this.app.screen.width / 2,
        manager.pos.y - this.offset.y, this.app.screen.height / 2,
      );

      // hide pick-ups out of the view distance
      if (distanceToCenter.total > this.viewDistance) manager.hide();
      else {
        manager.show();
        manager.update(this.offset);
      }
    });
  }

  track = () => {
    this.tick += 1;

    if (!this.activeManager || !this.tick) return;

    const mouse = this.app.renderer.plugins.interaction.mouse.global;
    const target = { x: mouse.x + this.offset.x, y: mouse.y + this.offset.y };

    if (!Number.isFinite(target.x) || !Number.isFinite(target.y)) return;

    // send the target to the server and simulate the effects locally
    this.props.socket.send(pack('target', { target, tick: this.tick }));
    this.activeManager.predict(target);
    this.activeManager.history.push({ target, tick: this.tick });

    this.sincePrediction = 0;
  }

  throwSpear = event => {
    if (!this.activeManager) return;

    // checks that if a key was used, it was the spacebar
    if ((event.key && event.key !== ' ') || this.activeManager.local.released || this.activeManager.sReleased) return;

    this.props.socket.send(pack('throw', {
      tick: this.serverTick, delta: Math.round(this.sinceSnapshot),
    }));
    this.activeManager.emulateThrow();
    assetManager.sounds.throw.play();
  }

  // new snapshot received
  sync = snapshot => {
    this.serverTick = snapshot.tick;

    // remove managers for players who aren't present
    this.playerManagers.forEach((manager, i) => {
      if (snapshot.players.some(player => player.id === manager.id)) return;

      // remove the manager if no player shares the id
      manager.hide({ player: true, spear: true, name: true, health: true });
      this.playerManagers.splice(i, 1);
    });

    // update managers
    snapshot.players.forEach(player => {
      // find the manager for this player
      let manager = this.playerManagers.find(mngr => mngr.id === player.id);

      // create one if needed
      if (!manager) {
        manager = new PlayerManager(player.id, player.name);
        this.app.stage.addChild(manager.container);
        manager.container.parentGroup = this.playerGroup;
        this.playerManagers.push(manager);
      }

      // check if the player is dead
      if (player.dead) {
        manager.hide({ player: false, spear: true, name: true, health: true });
        manager.animatePlayer('death');
      }

      // check if the player has thrown their spear
      if (player.released && manager.id !== this.props.socket.id) {
        manager.animateSpear('flying');
      } else if (manager.id !== this.props.socket.id) {
        manager.animateSpear('holding');
      }

      // check if the player is moving at full speed
      if (player.quick && manager.id !== this.props.socket.id) {
        manager.animatePlayer('moving');
      } else if (manager.id !== this.props.socket.id) {
        manager.animatePlayer('still');
      }

      manager.sync(player, snapshot.timestamp, manager.id === this.props.socket.id);

      // fix potential prediction errors
      if (manager.id === this.props.socket.id && snapshot.last) {
        manager.reconcile(player, snapshot.last);
      }
    });

    this.sinceSnapshot = 0;
  }

  addScorePickup = (id, pos) => {
    const manager = new ScorePickupManager(id, pos);

    this.app.stage.addChild(manager.sprite);
    manager.sprite.parentGroup = this.pickupGroup;
    this.scorePickupManagers.push(manager);
  }

  removeScorePickup = id => {
    const pickupToRemove = this.scorePickupManagers.find(manager => manager.id === id);
    if (!pickupToRemove) return;

    this.app.stage.removeChild(pickupToRemove.sprite);

    const index = this.scorePickupManagers.indexOf(pickupToRemove);
    this.scorePickupManagers.splice(index, 1);
  }
}

export default Game;
