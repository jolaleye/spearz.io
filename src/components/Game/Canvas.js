import React, { Component, createRef } from 'react';

import config from '../../config';

const { Stage, Bitmap } = window.createjs;

class Canvas extends Component {
  canvas = createRef();
  backgroundCell = this.props.assets.backgroundCell;

  state = {
    pos: { x: 0, y: 0 },
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

    this.props.socket.emit('requestUpdate', mouse, data => {
      this.setState({ pos: data.player.pos });
      this.drawBackground(data.player.pos);
    });
  }

  drawBackground = pos => {
    const { stage, backgroundCell } = this;

    const xNumOfCells = Math.ceil(stage.canvas.width / backgroundCell.width) + 1;
    const yNumOfCells = Math.ceil(stage.canvas.height / backgroundCell.height) + 1;

    const xOffset = pos.x % backgroundCell.width;
    const yOffset = pos.y % backgroundCell.height;

    stage.setTransform(-xOffset, -yOffset);

    for (let x = -xNumOfCells; x < xNumOfCells; x += 1) {
      for (let y = -yNumOfCells; y < yNumOfCells; y += 1) {
        const bgCell = new Bitmap(backgroundCell);
        bgCell.setTransform(x * bgCell.getBounds().width, y * bgCell.getBounds().height);
        stage.addChild(bgCell);
        stage.update();
      }
    }

    stage.setTransform();
  }

  render = () => <canvas ref={this.canvas} />
}

export default Canvas;
