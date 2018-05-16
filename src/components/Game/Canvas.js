import React, { Component, createRef } from 'react';

import config from '../../config';

class Canvas extends Component {
  canvas = createRef();

  componentDidMount() {
    this.resizeCanvas();
    window.addEventListener('resize', this.resizeCanvas);
    window.requestAnimationFrame(this.updateCycle);
  }

  resizeCanvas = () => {
    const canvas = this.canvas.current;
    canvas.width = Math.round(config.deviceWidth / config.scale);
    canvas.height = Math.round(config.deviceHeight / config.scale);
  }

  resetCanvas = () => {
    const canvas = this.canvas.current;
    const c = canvas.getContext('2d');

    c.clearRect(0, 0, canvas.width, canvas.height);
  }

  updateCycle = () => {
    window.requestAnimationFrame(this.updateCycle);
  }

  render = () => <canvas ref={this.canvas} />
}

export default Canvas;
