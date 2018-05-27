import React, { Component, createRef } from 'react';

import config from '../../config';
import playerSprite from '../../assets/player.png';
import spearSprite from '../../assets/spear.png';

const { Stage, Bitmap, Shape } = window.createjs;

class Canvas extends Component {
  canvas = createRef();
  backgroundCell = this.props.assets.backgroundCell;
  playerBitmap = new Bitmap(playerSprite);
  spearBitmap = new Bitmap(spearSprite);
  boundary = new Shape();
  warning = new Shape();

  state = {
    pos: { x: 0, y: 0 },
    direction: 0,
    distanceToSpear: 0,
    timeOutOfBounds: 0,
  }

  componentDidMount() {
    // Easel JS
    this.stage = new Stage(this.canvas.current);

    // initialize the canvas
    this.resizeCanvas();
    window.addEventListener('resize', this.resizeCanvas);

    // start game cycle
    window.requestAnimationFrame(this.updateCycle);
  }

  // scale the canvas to the current device
  resizeCanvas = () => {
    this.stage.canvas.width = Math.round(config.deviceWidth / config.scale);
    this.stage.canvas.height = Math.round(config.deviceHeight / config.scale);
  }

  updateCycle = () => {
    window.requestAnimationFrame(this.updateCycle);
    this.stage.removeAllChildren();

    const mouse = {
      x: this.stage.mouseX + (this.state.pos.x - (this.stage.canvas.width / 2)),
      y: this.stage.mouseY + (this.state.pos.y - (this.stage.canvas.height / 2)),
    };

    this.props.socket.emit('requestUpdate', mouse, async data => {
      await this.setState({
        pos: data.player.pos,
        direction: data.player.direction,
        distanceToSpear: data.player.distanceToSpear,
        timeOutOfBounds: data.player.outOfBounds ? data.player.outOfBounds.time : 0,
      });

      this.drawBackground();
      this.drawBoundary();
      this.drawPlayer();
      this.drawWarning();

      this.stage.update();
    });
  }

  drawPlayer = () => {
    const { stage, playerBitmap, spearBitmap } = this;
    stage.addChild(playerBitmap, spearBitmap);

    // center the player
    playerBitmap.regX = playerBitmap.getBounds().width / 2;
    playerBitmap.regY = playerBitmap.getBounds().height / 2;
    playerBitmap.x = stage.canvas.width / 2;
    playerBitmap.y = stage.canvas.height / 2;

    // position the spear (distance from player to spear provided by server)
    spearBitmap.regX = spearBitmap.getBounds().width / 2;
    spearBitmap.regY = spearBitmap.getBounds().height / 2;
    spearBitmap.x = playerBitmap.x + this.state.distanceToSpear.x;
    spearBitmap.y = playerBitmap.y + this.state.distanceToSpear.y;

    // rotate both towards the target
    playerBitmap.rotation = this.state.direction - 90;
    spearBitmap.rotation = this.state.direction - 90;
  }

  drawBackground = () => {
    const { stage, backgroundCell } = this;

    const xNumOfCells = Math.ceil(stage.canvas.width / backgroundCell.width) + 1;
    const yNumOfCells = Math.ceil(stage.canvas.height / backgroundCell.height) + 1;

    const xOffset = this.state.pos.x % backgroundCell.width;
    const yOffset = this.state.pos.y % backgroundCell.height;

    // draw cells around the player
    for (let x = -xNumOfCells; x < xNumOfCells; x += 1) {
      for (let y = -yNumOfCells; y < yNumOfCells; y += 1) {
        const bgCell = new Bitmap(backgroundCell);
        bgCell.setTransform(
          -xOffset + (x * bgCell.getBounds().width),
          -yOffset + (y * bgCell.getBounds().height),
        );
        stage.addChild(bgCell);
      }
    }
  }

  drawBoundary = () => {
    const { boundary, stage } = this;

    boundary.x = stage.canvas.width / 2;
    boundary.y = stage.canvas.height / 2;

    boundary.graphics.clear();
    boundary.graphics.setStrokeStyle(10).beginStroke('rgba(255, 255, 255, 0.1)')
      .drawCircle(-this.state.pos.x, -this.state.pos.y, 5500);

    stage.addChild(boundary);
  }

  drawWarning = () => {
    const { stage, warning } = this;
    const { timeOutOfBounds } = this.state;

    if (timeOutOfBounds === 0) return;
    let alpha = `.${timeOutOfBounds.toString().split('.')[1].slice(0, 3)}`;
    alpha = Math.min(alpha, 0.6);

    warning.graphics.clear();
    warning.graphics.beginRadialGradientFill(
      ['transparent', `rgba(249, 109, 107, ${alpha})`],
      [0.8, 1],
      stage.canvas.width / 2, stage.canvas.height / 2, 0,
      stage.canvas.width / 2, stage.canvas.height / 2, 800,
    ).drawRect(0, 0, stage.canvas.width, stage.canvas.height);

    stage.addChild(warning);
  }

  render = () => <canvas ref={this.canvas} />;
}

export default Canvas;
