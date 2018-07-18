import React, { Component, createRef } from 'react';
import * as PIXI from 'pixi.js';
import _ from 'lodash';

import './Game.css';
import HUD from './HUD/HUD';
import { pack, unpack } from '../../services/cereal';
import ArenaManager from './core/ArenaManager';
import PlayerManager from './core/PlayerManager';
import ScorePickupManager from './core/ScorePickupManager';
import CanvasHUD from './core/HUD';
import config from './core/config';
import assetManager from '../../assetManager';

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

    // canvas sizing
    this.app.renderer.autoResize = true;
    window.addEventListener('resize', this.resize);

    // SFX
    assetManager.sounds.soundtrack.play();

    this.hud = new CanvasHUD(this.app, this.props.socket);

    // manager for arena related rendering
    this.arenaManager = new ArenaManager(this.app.screen);
    this.app.stage.addChild(this.arenaManager.background, this.arenaManager.boundary);

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
  }

  resize = () => {
    this.app.renderer.resize(window.innerWidth, window.innerHeight);
    this.arenaManager.resize();
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
      manager.update(this.offset);
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

    // checks that if a key was used, it was the spacebar, and that the spear hasn't been released
    if ((event.key && event.key !== ' ') || this.activeManager.local.released) return;

    this.props.socket.send(pack('throw'));
    this.activeManager.emulateThrow();
    assetManager.sounds.throw.play();
  }

  // new snapshot received
  sync = snapshot => {
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
        this.app.stage.addChild(manager.player, manager.spear, manager.healthBar, manager.nameTag);
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

    // remove managers for score pick-ups that aren't present
    this.scorePickupManagers.forEach((manager, i) => {
      if (snapshot.scorePickups.some(pickup => pickup.id === manager.id)) return;

      // remove the manager if no pickup shares the id
      manager.hide();
      this.scorePickupManagers.splice(i, 1);
    });

    snapshot.scorePickups.forEach(pickup => {
      // find the manager for this pickup
      let manager = this.scorePickupManagers.find(mngr => mngr.id === pickup.id);

      // create one if needed
      if (!manager) {
        manager = new ScorePickupManager(pickup.id, pickup.pos);
        this.app.stage.addChild(manager.sprite);
        this.scorePickupManagers.push(manager);
      }
    });

    this.sinceSnapshot = 0;
  }
}

export default Game;
