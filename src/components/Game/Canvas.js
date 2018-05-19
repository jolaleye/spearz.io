import React, { Component, createRef } from 'react';
import _ from 'lodash';

import config from '../../config';

const { Stage, Bitmap, Rectangle } = window.createjs;

class Canvas extends Component {
  canvas = createRef();
  stage = null;
  background = null;

  state = {
    player: { pos: { x: 0, y: 0 } },
  };

  componentDidMount() {
    // EaselJS
    this.stage = new Stage(this.canvas.current);
    this.background = new Bitmap(this.props.assets.background);
    // initialize the canvas
    this.resizeCanvas();
    window.addEventListener('resize', this.resizeCanvas);
    this.drawBackground();
    // handle incoming data
    this.handleSocket();
    // start game cycle
    window.requestAnimationFrame(this.updateCycle);
  }

  // scale the canvas to the screen
  resizeCanvas = () => {
    const canvas = this.canvas.current;
    canvas.width = Math.round(config.deviceWidth / config.scale);
    canvas.height = Math.round(config.deviceHeight / config.scale);
  }

  // clear the canvas before each draw
  clearCanvas = () => {
    const canvas = this.canvas.current;
    const c = canvas.getContext('2d');
    c.clearRect(0, 0, canvas.width, canvas.height);
  }

  updateCycle = () => {
    window.requestAnimationFrame(this.updateCycle);
    this.props.socket.emit('requestUpdate');
    this.stage.update();
  }

  handleSocket = () => {
    const { socket } = this.props;
    socket.on('playerData', async player => {
      await this.setState({ player });
      this.drawBackground();
    });
  }

  drawBackground = () => {
    const canvas = this.canvas.current;
    const { stage, background } = this;
    const { player } = this.state;
    this.clearCanvas();

    // position of the canvas in the arena
    const xOffset = (player.pos.x - (canvas.width / 2)) + 2000 + 5500 || _.random(5000, 10000);
    const yOffset = (player.pos.y - (canvas.height / 2)) + 2000 + 5500 || _.random(5000, 10000);

    background.sourceRect = new Rectangle(xOffset, yOffset, canvas.width, canvas.height);
    stage.addChild(background);
  }

  render = () => <canvas ref={this.canvas} />
}

export default Canvas;
