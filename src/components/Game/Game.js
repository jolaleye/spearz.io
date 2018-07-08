import React, { Component, createRef } from 'react';
import * as PIXI from 'pixi.js';

import './Game.css';
import ArenaManager from './ArenaManager';
import { pack } from '../../services/cereal';

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

    // arena manager
    this.arenaManager = new ArenaManager(this.app.screen);
    this.app.stage.addChild(this.arenaManager.background);

    this.tick = 0;

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

  }

  getTarget = () => {
    const target = this.app.renderer.plugins.interaction.mouse.global;
    this.props.socket.send(pack({ _: 'target', target, tick: this.tick }));

    this.tick += 1;
  }
}

export default Game;
