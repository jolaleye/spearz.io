import React, { Component, createRef } from 'react';
import { Application } from 'pixi.js';

class Game extends Component {
  canvasRef = createRef();

  componentDidMount() {
    // PIXI application
    this.app = new Application({
      view: this.canvasRef.current,
      antialias: true,
      resolution: window.devicePixelRatio,
      transparent: true,
    });

    // canvas sizing
    this.app.renderer.autoResize = true;
    window.addEventListener('resize', this.resize);
    this.resize();
  }

  resize = () => {
    this.app.renderer.resize(window.innerWidth, window.innerHeight);
  }

  render = () => (
    <div className="game">
      <canvas ref={this.canvasRef} />
    </div>
  );
}

export default Game;
