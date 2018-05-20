import React, { Component, createRef } from 'react';

import config from '../../config';

const { Stage, Bitmap } = window.createjs;

class Canvas extends Component {
  canvas = createRef();

  state = {
    player: null,
  }

  componentDidMount() {
    // Easel JS
    this.stage = new Stage(this.canvas.current);
    this.backgroundCell = this.props.assets.backgroundCell;
    // initialize the canvas
    this.resizeCanvas();
    window.addEventListener('resize', this.resizeCanvas);
    // get initial player data & start game cycle
    this.props.socket.emit('requestPlayerData', data => {
      this.setState({ player: data });
      window.requestAnimationFrame(this.updateCycle);
    });
  }

  // scale the canvas to the current device
  resizeCanvas = () => {
    const canvas = this.canvas.current;
    canvas.width = Math.round(config.deviceWidth / config.scale);
    canvas.height = Math.round(config.deviceHeight / config.scale);
  }

  updateCycle = async () => {
    this.props.socket.emit('requestPlayerData', data => this.setState({ player: data }));

    this.stage.removeAllChildren();
    this.drawBackground();
    window.requestAnimationFrame(this.updateCycle);
  }

  drawBackground = () => {
    const { stage, backgroundCell } = this;
    const { pos } = this.state.player;

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
