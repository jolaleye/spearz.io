import React, { Component, createRef } from 'react';

import config from '../../config';
import playerSprite from '../../assets/player.png';
import spearSprite from '../../assets/spear.png';

const { Stage, Bitmap } = window.createjs;

class Canvas extends Component {
  canvas = createRef();
  backgroundCell = this.props.assets.backgroundCell;
  playerBitmap = new Bitmap(playerSprite);
  spearBitmap = new Bitmap(spearSprite);

  state = {
    pos: { x: 0, y: 0 },
    direction: 90,
  }

  componentDidMount() {
    // set up Easel JS objects
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
      });

      this.drawBackground();
      this.drawPlayer();
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

  render = () => <canvas ref={this.canvas} />;
}

export default Canvas;
