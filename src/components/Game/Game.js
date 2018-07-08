import React, { Component, createRef } from 'react';
import * as PIXI from 'pixi.js';
import _ from 'lodash';

import './Game.css';
import ArenaManager from './ArenaManager';
import { pack, unpack } from '../../services/cereal';
import PlayerManager from './PlayerManager';

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

    // manager for arena related rendering
    this.arenaManager = new ArenaManager(this.app.screen);
    this.app.stage.addChild(this.arenaManager.background);

    // managers for player rendering
    this.playerManagers = [];

    // listen for snapshots
    this.props.socket.addEventListener('message', packet => {
      const data = unpack(packet.data);
      if (data._ === 'snapshot') this.sync(data);
    });

    this.tick = 0;
    this.sinceSnapshot = 0;

    // render loop
    this.app.ticker.add(this.renderX);
    // target tracking
    this.getTargetInterval = setInterval(this.getTarget, 15);

    this.resize();
  }

  componentWillUnmount() {
    this.app.ticker.stop();
    clearInterval(this.getTargetInterval);
  }

  resize = () => {
    this.app.renderer.resize(window.innerWidth, window.innerHeight);
    this.arenaManager.resize(this.app.screen);
  }

  render = () => (
    <div className="game">
      <canvas ref={this.canvasRef} />
    </div>
  );


  renderX = () => {
    const thisManager = this.playerManagers.find(mngr => mngr.id === this.props.socket.id);
    if (thisManager) this.arenaManager.updateBackground(thisManager.local.pos);

    this.sinceSnapshot += this.app.ticker.elapsedMS;

    this.playerManagers.forEach(manager => {
      // interpolate other players (the curent player uses prediction)
      if (manager.id !== thisManager.id) {
        if (!manager.origin || !manager.next) return;

        // interpolate between the origin and next states
        const smoothPeriod = manager.next.timestamp - manager.origin.timestamp;
        const delta = this.sinceSnapshot / smoothPeriod;
        manager.interpolate(_.clamp(delta, 1));
      }

      manager.update();
    });
  }

  getTarget = () => {
    const thisManager = this.playerManagers.find(mngr => mngr.id === this.props.socket.id);
    if (!thisManager) return;

    const mouse = this.app.renderer.plugins.interaction.mouse.global;
    const target = {
      x: mouse.x + (thisManager.local.pos.x - (this.app.screen.width / 2)),
      y: mouse.y + (thisManager.local.pos.y - (this.app.screen.height / 2)),
    };

    // send the target to the server and simulate the effects locally
    this.props.socket.send(pack({ _: 'target', target, tick: this.tick }));
    thisManager.predict(target);

    this.tick += 1;
  }

  // new snapshot received
  sync = snapshot => {
    // remove managers for players who aren't present
    this.playerManagers.forEach((manager, i) => {
      if (snapshot.players.some(player => player.id === manager.id)) return;

      // remove the manager if no player shares the id
      this.playerManagers.splice(i, 1);
    });

    // update managers
    snapshot.players.forEach(player => {
      // find the manager for this player
      let manager = this.playerManagers.find(mngr => mngr.id === player.id);

      // create one if needed
      if (!manager) {
        manager = new PlayerManager(player.id);
        this.playerManagers.push(manager);
      }

      manager.sync(player, snapshot.timestamp);
    });

    this.sinceSnapshot = 0;
  }
}

export default Game;
