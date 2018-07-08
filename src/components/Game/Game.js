import React, { Component, createRef } from 'react';
import * as PIXI from 'pixi.js';

import './Game.css';
import ArenaManager from './ArenaManager';

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

    // render loop
    this.app.ticker.add(this.renderX);

    this.resize();
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
}

export default Game;
