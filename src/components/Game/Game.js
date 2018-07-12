import React, { Component, createRef } from 'react';
import * as PIXI from 'pixi.js';
import _ from 'lodash';

import './Game.css';
import HUD from './HUD/HUD';
import ArenaManager from './ArenaManager';
import { pack, unpack } from '../../services/cereal';
import PlayerManager from './PlayerManager';
import cursor from '../../assets/cursor.png';
import config from './config';

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

    // custom cursor
    this.app.renderer.plugins.interaction.cursorStyles.default = `url(${cursor}), auto`;

    // canvas sizing
    this.app.renderer.autoResize = true;
    window.addEventListener('resize', this.resize);

    // manager for arena related rendering
    this.arenaManager = new ArenaManager(this.app.screen);
    this.app.stage.addChild(this.arenaManager.background, this.arenaManager.boundary);

    // managers for player rendering
    this.playerManagers = [];

    // listen for snapshots
    this.props.socket.addEventListener('message', packet => {
      const data = unpack(packet.data);
      switch (data._) {
        case 'snapshot':
          this.sync(data);
          break;

        case 'hit':
          this.returnSpear();
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
    this.getTargetInterval = setInterval(this.getTarget, config.tickrate);

    this.resize();
  }

  componentWillUnmount() {
    this.app.ticker.stop();
    clearInterval(this.getTargetInterval);
    this.playerManagers = [];
    this.app.stage.removeChildren();
  }

  resize = () => {
    this.app.renderer.resize(window.innerWidth, window.innerHeight);
    this.arenaManager.resize(this.app.screen);
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
    clearInterval(this.getTargetInterval);

    // remove player health bar, name, spear
    this.activeManager.hide(false, true, true, true);
  }

  renderX = () => {
    if (!this.activeManager) return;

    this.sinceSnapshot += this.app.ticker.elapsedMS;
    this.sincePrediction += this.app.ticker.elapsedMS;

    // player rendering
    this.playerManagers.forEach(manager => {
      let smoothPeriod;
      let delta;

      if (manager.id === this.activeManager.id) {
        smoothPeriod = config.tickrate;
        delta = this.sincePrediction / smoothPeriod;
      } else {
        smoothPeriod = manager.next.timestamp - manager.origin.timestamp;
        delta = this.sinceSnapshot / smoothPeriod;
      }

      manager.interpolate(_.clamp(delta, 1));
      manager.update(this.offset);
    });

    // arena rendering
    this.arenaManager.update(this.offset);
  }

  getTarget = () => {
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
    if ((event.key && event.key !== ' ') || this.activeManager.released) return;

    this.props.socket.send(pack('throw'));
    this.activeManager.emulateThrow();
  }

  returnSpear = () => {
    if (this.activeManager) {
      this.activeManager.local.released = false;
    }
  }

  // new snapshot received
  sync = snapshot => {
    // remove managers for players who aren't present
    this.playerManagers.forEach((manager, i) => {
      if (snapshot.players.some(player => player.id === manager.id)) return;

      // remove the manager if no player shares the id
      manager.hide(true, true, true, true);
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

      // remove player health bar, name, and spear if they're dead
      if (player.dead) manager.hide(false, true, true, true);

      manager.sync(player, snapshot.timestamp, manager.id === this.props.socket.id);

      // fix potential prediction errors
      if (manager.id === this.props.socket.id && snapshot.last) {
        manager.reconcile(player, snapshot.last);
      }
    });

    this.sinceSnapshot = 0;
  }
}

export default Game;
